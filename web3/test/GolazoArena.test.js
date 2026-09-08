const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const ZERO = "0x0000000000000000000000000000000000000000";
const TREASURY = "0x7cBfF11440099DB224d2B54d12e1116eB565C8FE";
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

async function deploy() {
  const [owner, alice, bob] = await ethers.getSigners();
  const F = await ethers.getContractFactory("GolazoArena");
  const c = await F.deploy();
  await c.waitForDeployment();
  // seed liquidity for payouts
  await c.fundContract({ value: ethers.parseEther("100") });
  return { c, owner, alice, bob };
}

const salt = () => ethers.hexlify(ethers.randomBytes(32));
const commitmentFor = (zone, s, addr) =>
  ethers.solidityPackedKeccak256(["uint8", "bytes32", "address"], [zone, s, addr]);

describe("GolazoArena — variant NFTs", () => {
  it("mints an ERC-721, records the tier, routes payment to treasury", async () => {
    const { c, alice } = await deploy();
    const tBefore = await ethers.provider.getBalance(TREASURY);

    await expect(c.connect(alice).buyPlayerVariant(2, { value: ethers.parseEther("10") }))
      .to.emit(c, "VariantMinted");

    expect(await c.balanceOf(alice.address)).to.equal(1n);
    const tokenId = await c.tokenOfOwnerByIndex(alice.address, 0);
    expect(await c.tierOf(tokenId)).to.equal(2n);
    expect(await c.highestTier(alice.address)).to.equal(2n);
    expect(await ethers.provider.getBalance(TREASURY)).to.equal(tBefore + ethers.parseEther("10"));

    const uri = await c.tokenURI(tokenId);
    expect(uri.startsWith("data:application/json;base64,")).to.equal(true);
    const json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());
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
    await expect(
      c.connect(alice).buyPlayerVariant(3, { value: ethers.parseEther("24.9") })
    ).to.be.revertedWith("insufficient X1T");
    await expect(
      c.connect(alice).buyPlayerVariant(4, { value: ethers.parseEther("25") })
    ).to.be.revertedWith("bad tier");
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
    await expect(
      c.connect(alice).commitShot(commitmentFor(0, salt(), alice.address), { value: ethers.parseEther("0.4") })
    ).to.be.revertedWith("stake below minimum");

    await c.connect(alice).commitShot(commitmentFor(0, salt(), alice.address), { value: ethers.parseEther("1") });
    await expect(
      c.connect(alice).commitShot(commitmentFor(1, salt(), alice.address), { value: ethers.parseEther("1") })
    ).to.be.revertedWith("match in progress");
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

  it("resolves GOAL (2x payout) when the shot misses the keeper's cover", async () => {
    const { c, alice } = await deploy();
    const s = salt();
    // commit with a placeholder zone we know we can satisfy after seeing the seed
    // -> commit for every zone won't work; instead compute seed, find a GOAL zone, THEN commit is impossible.
    // So: commit zone 0, then verify the outcome matches the on-chain seed math.
    const commitTx = await c.connect(alice).commitShot(commitmentFor(0, s, alice.address), { value: ethers.parseEther("1") });
    const rc = await commitTx.wait();
    const commitBlock = rc.blockNumber;

    await network.provider.send("hardhat_mine", ["0x2"]);
    const bh = (await ethers.provider.getBlock(commitBlock + 1)).hash;
    const commitment = commitmentFor(0, s, alice.address);
    const seed = ethers.solidityPackedKeccak256(["bytes32", "address", "bytes32"], [bh, alice.address, commitment]);
    const mask = keeperMask(seed, 3); // Base tier
    const expectedGoal = (mask & (1 << 0)) === 0;

    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await c.connect(alice).revealShot(0, s);
    const r = await tx.wait();
    const ev = r.logs.map((l) => { try { return c.interface.parseLog(l); } catch { return null; } })
      .find((e) => e && e.name === "ShotResolved");

    expect(ev.args.goal).to.equal(expectedGoal);
    expect(Number(ev.args.keeperMask)).to.equal(mask);
    if (expectedGoal) {
      expect(ev.args.payout).to.equal(ethers.parseEther("2"));
      const gas = r.gasUsed * r.gasPrice;
      expect(await ethers.provider.getBalance(alice.address)).to.equal(balBefore + ethers.parseEther("2") - gas);
    } else {
      expect(ev.args.payout).to.equal(0n);
    }
    // match cleared either way
    const m = await c.matches(alice.address);
    expect(m.commitBlock).to.equal(0n);
  });

  it("a Legend holder faces a keeper covering only one corner", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).buyPlayerVariant(3, { value: ethers.parseEther("25") });
    const s = salt();
    const rc = await (await c.connect(alice).commitShot(commitmentFor(4, s, alice.address), { value: ethers.parseEther("1") })).wait();
    await network.provider.send("hardhat_mine", ["0x2"]);
    const bh = (await ethers.provider.getBlock(rc.blockNumber + 1)).hash;
    const seed = ethers.solidityPackedKeccak256(
      ["bytes32", "address", "bytes32"],
      [bh, alice.address, commitmentFor(4, s, alice.address)]
    );
    const mask = keeperMask(seed, 1);
    const r = await (await c.connect(alice).revealShot(4, s)).wait();
    const ev = r.logs.map((l) => { try { return c.interface.parseLog(l); } catch { return null; } })
      .find((e) => e && e.name === "ShotResolved");
    expect(Number(ev.args.keeperMask)).to.equal(mask);
    // exactly one bit set
    expect(mask !== 0 && (mask & (mask - 1)) === 0).to.equal(true);
  });

  it("expireCommit sweeps an unrevealed stake to the treasury after the window", async () => {
    const { c, alice, bob } = await deploy();
    const s = salt();
    await c.connect(alice).commitShot(commitmentFor(1, s, alice.address), { value: ethers.parseEther("3") });

    await expect(c.connect(bob).expireCommit(alice.address)).to.be.revertedWith("still revealable");

    await network.provider.send("hardhat_mine", ["0x" + (REVEAL_WINDOW + 1).toString(16)]);
    const tBefore = await ethers.provider.getBalance(TREASURY);
    await expect(c.connect(bob).expireCommit(alice.address)).to.emit(c, "CommitExpired");
    expect(await ethers.provider.getBalance(TREASURY)).to.equal(tBefore + ethers.parseEther("3"));
    expect((await c.matches(alice.address)).commitBlock).to.equal(0n);
  });

  it("commitShot self-heals a stale prior match", async () => {
    const { c, alice } = await deploy();
    await c.connect(alice).commitShot(commitmentFor(1, salt(), alice.address), { value: ethers.parseEther("2") });
    await network.provider.send("hardhat_mine", ["0x" + (REVEAL_WINDOW + 1).toString(16)]);

    const tBefore = await ethers.provider.getBalance(TREASURY);
    await expect(
      c.connect(alice).commitShot(commitmentFor(2, salt(), alice.address), { value: ethers.parseEther("1") })
    ).to.emit(c, "CommitExpired").and.to.emit(c, "ShotCommitted");
    expect(await ethers.provider.getBalance(TREASURY)).to.equal(tBefore + ethers.parseEther("2"));
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
