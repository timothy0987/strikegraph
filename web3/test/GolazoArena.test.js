const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const REVEAL_WINDOW = 240;

// mirror of the contract's _keeperMask (Fisher-Yates partial shuffle)
function keeperMask(seedHex, k) {
  const z = [0, 1, 2, 3, 4, 5];
  let mask = 0;
  for (let i = 0; i < k; i++) {
    const h = ethers.solidityPackedKeccak256(["bytes32", "uint8"], [seedHex, i]);
    const j = i + Number(BigInt(h) % BigInt(6 - i));
    [z[i], z[j]] = [z[j], z[i]];
    mask |= 1 << z[i];
  }
  return mask;
}

async function deploy(fund = "100") {
  const [owner, alice, bob] = await ethers.getSigners();
  const F = await ethers.getContractFactory("GolazoArena");
  const c = await F.deploy();
  await c.waitForDeployment();
  if (fund !== "0") await c.fundContract({ value: ethers.parseEther(fund) });
  return { c, owner, alice, bob };
}

const salt = () => ethers.hexlify(ethers.randomBytes(32));
const commitmentFor = (zone, s, addr) =>
  ethers.solidityPackedKeccak256(["uint8", "bytes32", "address"], [zone, s, addr]);

async function resolve(c, signer, zone) {
  const s = salt();
  const commitment = commitmentFor(zone, s, signer.address);
  const cr = await (await c.connect(signer).commitShot(commitment, { value: ethers.parseEther("1") })).wait();
  await network.provider.send("hardhat_mine", ["0x2"]);
  const bh = (await ethers.provider.getBlock(cr.blockNumber + 1)).hash;
  const seed = ethers.solidityPackedKeccak256(["bytes32", "address", "bytes32"], [bh, signer.address, commitment]);
  const k = Number(await c.keeperCover(await c.highestTier(signer.address)));
  const expMask = keeperMask(seed, k);
  const r = await (await c.connect(signer).revealShot(zone, s)).wait();
  const ev = r.logs.map((l) => { try { return c.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "ShotResolved");
  return { ev, expMask, expGoal: (expMask & (1 << zone)) === 0 };
}

describe("GolazoArena — variant NFTs", () => {
  it("mints an ERC-721, records the tier, keeps the payment in the pool", async () => {
    const { c, alice } = await deploy();
    const poolBefore = await c.poolBalance();

    await expect(c.connect(alice).buyPlayerVariant(2, { value: ethers.parseEther("10") }))
      .to.emit(c, "VariantMinted");

    expect(await c.balanceOf(alice.address)).to.equal(1n);
    const tokenId = await c.tokenOfOwnerByIndex(alice.address, 0);
    expect(await c.tierOf(tokenId)).to.equal(2n);
    expect(await c.highestTier(alice.address)).to.equal(2n);
    // sale proceeds stay in the contract pool
    expect(await c.poolBalance()).to.equal(poolBefore + ethers.parseEther("10"));

    const json = JSON.parse(Buffer.from((await c.tokenURI(tokenId)).split(",")[1], "base64").toString());
    expect(json.name).to.contain("Sniper");
    expect(json.image.startsWith("data:image/svg+xml;base64,")).to.equal(true);
  });

  it("highestTier tracks the best NFT held and drops on transfer-out", async () => {
    const { c, alice, bob } = await deploy();
    await c.connect(alice).buyPlayerVariant(1, { value: ethers.parseEther("5") });
    await c.connect(alice).buyPlayerVariant(3, { value: ethers.parseEther("25") });
    expect(await c.highestTier(alice.address)).to.equal(3n);

    const legend = await c.tokenOfOwnerByIndex(alice.address, 1);
    await c.connect(alice).transferFrom(alice.address, bob.address, legend);
    expect(await c.highestTier(alice.address)).to.equal(1n);
    expect(await c.highestTier(bob.address)).to.equal(3n);
  });

  it("rejects an underpriced or invalid tier", async () => {
    const { c, alice } = await deploy();
    await expect(c.connect(alice).buyPlayerVariant(3, { value: ethers.parseEther("24.9") }))
      .to.be.revertedWith("insufficient X1T");
    await expect(c.connect(alice).buyPlayerVariant(4, { value: ethers.parseEther("25") }))
      .to.be.revertedWith("bad tier");
  });
});

describe("GolazoArena — commit / reveal penalty", () => {
  it("keeperCover: 3 for Base/Striker, 2 for Sniper, 1 for Legend", async () => {
    const { c } = await deploy();
    expect(await c.keeperCover(0)).to.equal(3n);
    expect(await c.keeperCover(1)).to.equal(3n);
    expect(await c.keeperCover(2)).to.equal(2n);
    expect(await c.keeperCover(3)).to.equal(1n);
  });

  it("enforces the minimum stake and blocks a double commit", async () => {
    const { c, alice } = await deploy();
    await expect(c.connect(alice).commitShot(commitmentFor(0, salt(), alice.address), { value: ethers.parseEther("0.4") }))
      .to.be.revertedWith("stake below minimum");

    await c.connect(alice).commitShot(commitmentFor(0, salt(), alice.address), { value: ethers.parseEther("1") });
    await expect(c.connect(alice).commitShot(commitmentFor(1, salt(), alice.address), { value: ethers.parseEther("1") }))
      .to.be.revertedWith("match in progress");
  });

  it("caps the stake to what the pool can pay 2x on", async () => {
    const { c, alice } = await deploy("2"); // pool = 2 ETH
    // 1 ETH stake -> pool becomes 3, need 2*1 <= 3 -> ok
    await c.connect(alice).commitShot(commitmentFor(0, salt(), alice.address), { value: ethers.parseEther("1") });
    // clear it
    await network.provider.send("hardhat_mine", ["0x" + (REVEAL_WINDOW + 1).toString(16)]);
    await c.expireCommit(alice.address);
    // now pool = 3 ETH; a 2 ETH stake -> pool 5, need 4 <= 5 ok; a 3 ETH stake -> pool 6, need 6 <= 6 ok;
    // a 3.01 ETH stake -> pool 6.01, need 6.02 <= 6.01 -> revert
    await expect(c.connect(alice).commitShot(commitmentFor(0, salt(), alice.address), { value: ethers.parseEther("3.01") }))
      .to.be.revertedWith("stake exceeds payout capacity");
  });

  it("reveal is rejected too early, on a bad salt, and on a wrong zone", async () => {
    const { c, alice } = await deploy();
    const s = salt();
    await c.connect(alice).commitShot(commitmentFor(3, s, alice.address), { value: ethers.parseEther("1") });
    await expect(c.connect(alice).revealShot(3, s)).to.be.revertedWith("reveal too early");
    await network.provider.send("hardhat_mine", ["0x2"]);
    await expect(c.connect(alice).revealShot(3, salt())).to.be.revertedWith("reveal does not match commit");
    await expect(c.connect(alice).revealShot(2, s)).to.be.revertedWith("reveal does not match commit");
  });

  it("GOAL pays 2x from the pool; SAVED leaves the stake in the pool", async () => {
    const { c, alice } = await deploy();
    const poolBefore = await c.poolBalance();
    const { ev, expMask, expGoal } = await resolve(c, alice, 0);

    expect(ev.args.goal).to.equal(expGoal);
    expect(Number(ev.args.keeperMask)).to.equal(expMask);
    if (expGoal) {
      expect(ev.args.payout).to.equal(ethers.parseEther("2"));
      // pool: +1 stake in, -2 out => net -1
      expect(await c.poolBalance()).to.equal(poolBefore - ethers.parseEther("1"));
    } else {
      expect(ev.args.payout).to.equal(0n);
      // pool: +1 stake in, nothing out
      expect(await c.poolBalance()).to.equal(poolBefore + ethers.parseEther("1"));
    }
    expect((await c.matches(alice.address)).commitBlock).to.equal(0n);
  });

  it("a Legend holder faces a keeper covering exactly one corner", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).buyPlayerVariant(3, { value: ethers.parseEther("25") });
    const { ev } = await resolve(c, alice, 4);
    const m = Number(ev.args.keeperMask);
    expect(m !== 0 && (m & (m - 1)) === 0).to.equal(true);
  });

  it("expireCommit clears a stale match and forfeits the stake to the pool", async () => {
    const { c, alice, bob } = await deploy();
    await c.connect(alice).commitShot(commitmentFor(1, salt(), alice.address), { value: ethers.parseEther("3") });
    const poolAfterCommit = await c.poolBalance();

    await expect(c.connect(bob).expireCommit(alice.address)).to.be.revertedWith("still revealable");
    await network.provider.send("hardhat_mine", ["0x" + (REVEAL_WINDOW + 1).toString(16)]);
    await expect(c.connect(bob).expireCommit(alice.address)).to.emit(c, "CommitExpired");

    expect(await c.poolBalance()).to.equal(poolAfterCommit); // stake stayed in
    expect((await c.matches(alice.address)).commitBlock).to.equal(0n);
  });

  it("commitShot self-heals a stale prior match, keeping its stake", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).commitShot(commitmentFor(1, salt(), alice.address), { value: ethers.parseEther("2") });
    await network.provider.send("hardhat_mine", ["0x" + (REVEAL_WINDOW + 1).toString(16)]);
    const poolBefore = await c.poolBalance();

    await expect(c.connect(alice).commitShot(commitmentFor(2, salt(), alice.address), { value: ethers.parseEther("1") }))
      .to.emit(c, "CommitExpired").and.to.emit(c, "ShotCommitted");

    expect(await c.poolBalance()).to.equal(poolBefore + ethers.parseEther("1")); // only the new stake added
    expect((await c.matches(alice.address)).stake).to.equal(ethers.parseEther("1"));
  });
});

describe("GolazoArena — liquidity", () => {
  it("only the owner withdraws", async () => {
    const { c, owner, alice } = await deploy();
    await expect(c.connect(alice).withdrawLiquidity(1n)).to.be.revertedWith("not owner");
    await expect(c.connect(owner).withdrawLiquidity(ethers.parseEther("10"))).to.emit(c, "LiquidityWithdrawn");
  });
});
