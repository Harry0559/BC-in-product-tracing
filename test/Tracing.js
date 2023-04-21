const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const { ethers } = require("hardhat");

describe("Tracing contract", function() {
    async function deployTracingFixture() {
        const [creator, add1, add2, add3] = await ethers.getSigners();
        const wallet1 = new ethers.Wallet("0x0123456789012345678901234567890123456789012345678901234567890123",add1.provider);
        const wallet2 = new ethers.Wallet("0x9876543210987654321098765432109876543210987654321098765432109876",add1.provider);
        const wallet3 = new ethers.Wallet("0x1234567890123456789012345678901234567890123456789012345678901234",add1.provider);
        await transferETH(add1, wallet1, 1);
        await transferETH(add1, wallet2, 1);
        await transferETH(add1, wallet3, 1);

        const TracingFactory = await ethers.getContractFactory("Tracing");
        const Tracing = await TracingFactory.deploy();
        await Tracing.deployed();

        return {TracingFactory, Tracing, creator, add1, add2, add3, wallet1, wallet2, wallet3};
    }

    describe("Deploy", function() {
        it("Shoule set the right creator", async function() {
            const {Tracing, creator} = await loadFixture(deployTracingFixture);
            expect(await Tracing.creator()).to.equal(creator.address);
        });
    });

    describe("Authorize", function() {
        it("Should emit Authorized event", async function() {
            const {Tracing, add1} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(add1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add1.address);
        });
        it("Should fail if the sender is not the creator", async function() {
            const {Tracing, add1, add2} = await loadFixture(deployTracingFixture);
            await expect(Tracing.connect(add1).authorize(add2.address))
                .to.be.revertedWith("Only the creator can call this function.");
        });
    });

    describe("Add product", function() {
        it("An authorized provider can add product without sources", async function() {
            const {Tracing, add1} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(add1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add1.address);
            await expect(Tracing.connect(add1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[],[]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(add1.address, 1);
        });
        it("An authorized provider can add product with sources", async function() {
            const {Tracing, wallet1, wallet2, add3} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(wallet1.address)).to.emit(Tracing,"Authorized").withArgs(wallet1.address);
            await expect(Tracing.authorize(wallet2.address)).to.emit(Tracing,"Authorized").withArgs(wallet2.address);
            await expect(Tracing.authorize(add3.address)).to.emit(Tracing,"Authorized").withArgs(add3.address);
            await expect(Tracing.connect(wallet1).addProduct(1, "name1", "time1", "location1", [], [], []))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(wallet1.address, 1);
            await expect(Tracing.connect(wallet2).addProduct(2, "name2", "time2", "location2", [], [], []))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(wallet2.address, 2);
            const signature13 = await signTx(1,add3.address,wallet1);
            const signature23 = await signTx(2,add3.address,wallet2);
            await expect(Tracing.connect(add3).addProduct(
                3,
                "name3",
                "time3",
                "location3",
                [wallet1.address,wallet2.address],
                [1,2],
                [signature13,signature23]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(add3.address, 3);
        });
        it("Shoule fail if the sender is not authorized", async function() {
            const {Tracing, add1} = await loadFixture(deployTracingFixture);
            await expect(Tracing.connect(add1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[],[]
            )).to.be.revertedWith("You are not authorized to call this function.");
        });
        it("Should fail if the ID is already used", async function() {
            const {Tracing, add1} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(add1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add1.address);
            await expect(Tracing.connect(add1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[],[]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(add1.address, 1);
            await expect(Tracing.connect(add1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[],[]
            ))
                .to.be.revertedWithCustomError(Tracing, "IdAlreadyUsed")
                .withArgs(1);
        });
        it("Should fail if the product information is empty", async function() {
            const {Tracing, add1} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(add1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add1.address);
            await expect(Tracing.connect(add1).addProduct(
                1,
                "",
                "time1",
                "location1",
                [],[],[]
            )).to.be.revertedWithCustomError(Tracing, "InformationIsEmpty");
        });
        it("Should fail if the lengths of source information arrays are unequal", async function() {
            const {Tracing, add1} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(add1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add1.address);
            await expect(Tracing.connect(add1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[2],[]
            )).to.be.revertedWithCustomError(Tracing, "UnequalLength");
        });
        it("Should fail if the source provider is not authorized", async function() {
            const {Tracing, wallet1, add3} = await loadFixture(deployTracingFixture);
            const signature13 = await signTx(1,add3.address,wallet1);
            await expect(Tracing.authorize(add3.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add3.address);
            await expect(Tracing.connect(add3).addProduct(
                3,
                "name3",
                "time3",
                "location3",
                [wallet1.address],[1],[signature13]
            ))
                .to.be.revertedWithCustomError(Tracing, "ProviderNotAuthorized")
                .withArgs(wallet1.address);
        });
        it("Should fail if the source ID doesn't exist", async function() {
            const {Tracing, wallet1, add3} = await loadFixture(deployTracingFixture);
            const signature13 = await signTx(1,add3.address,wallet1);
            await expect(Tracing.authorize(wallet1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(wallet1.address);
            await expect(Tracing.authorize(add3.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add3.address);
            await expect(Tracing.connect(add3).addProduct(
                3,
                "name3",
                "time3",
                "location3",
                [wallet1.address],[1],[signature13]
            ))
                .to.be.revertedWithCustomError(Tracing, "IdNotExist")
                .withArgs(wallet1.address,1);
        });
        it("Should fail if the validation of the signature dosen't succeed", async function() {
            const {Tracing, wallet1, add3} = await loadFixture(deployTracingFixture);
            const signature13 = await signTx(2,add3.address,wallet1); //id here is 2
            await expect(Tracing.authorize(wallet1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(wallet1.address);
            await expect(Tracing.authorize(add3.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add3.address);
            await expect(Tracing.connect(wallet1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[],[]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(wallet1.address, 1);
            await expect(Tracing.connect(add3).addProduct(
                3,
                "name3",
                "time3",
                "location3",
                [wallet1.address],[1],[signature13] //id in signature13 is 2, but it is 1 in the second array, so it will fail
            ))
                .to.be.revertedWithCustomError(Tracing, "ValidationFail")
                .withArgs(wallet1.address,1);
        });
    });
    describe("Trace product", function() {
        it("Tracing information should be correct", async function() {
            const {Tracing, wallet1, wallet2, wallet3, add2} = await loadFixture(deployTracingFixture);
            await expect(Tracing.authorize(wallet1.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(wallet1.address);
            await expect(Tracing.authorize(wallet2.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(wallet2.address);
            await expect(Tracing.authorize(wallet3.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(wallet3.address);
            await expect(Tracing.authorize(add2.address))
                .to.emit(Tracing,"Authorized")
                .withArgs(add2.address);
            
            await expect(Tracing.connect(wallet1).addProduct(
                1,
                "name1",
                "time1",
                "location1",
                [],[],[]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(wallet1.address, 1);
            await expect(Tracing.connect(wallet3).addProduct(
                3,
                "name3",
                "time3",
                "location3",
                [],[],[]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(wallet3.address, 3);
            
            const signature12 = await signTx(1,wallet2.address,wallet1);
            await expect(Tracing.connect(wallet2).addProduct(
                2,
                "name2",
                "time2",
                "location2",
                [wallet1.address],[1],[signature12]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(wallet2.address, 2);
            
            const signature24 = await signTx(2,add2.address,wallet2);
            const signature34 = await signTx(3,add2.address,wallet3);
            await expect(Tracing.connect(add2).addProduct(
                4,
                "name4",
                "time4",
                "location4",
                [wallet2.address,wallet3.address],[2,3],[signature24,signature34]
            ))
                .to.emit(Tracing,"ProductAdded")
                .withArgs(add2.address, 4);
            const information = [
                "name4",
                "time4",
                "location4",
                [[
                    wallet2.address,
                    2
                ],[
                    wallet3.address,
                    3
                ]]
            ]

            expect(await Tracing.traceProduct(add2.address,4)).to.deep.equal(information);
        });
    });
});

async function signTx(id,receiver,provider) {
    const message = ethers.utils.solidityKeccak256(["uint256", "address"],[id,receiver]);
    const messageBytes = ethers.utils.arrayify(message);
    const signature = await provider.signMessage(messageBytes);
    return signature
}

async function transferETH(_from, _to, _eth) {
    const tx = {
        to: _to.address,
        value: ethers.utils.parseEther(_eth.toString())
    };
    const receipt = await _from.sendTransaction(tx);
    await receipt.wait();
}
