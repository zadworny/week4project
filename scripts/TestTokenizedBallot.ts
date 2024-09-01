import { viem } from "hardhat";
import { toHex, hexToString } from "viem";
import { 
        MINT_VALUE, //10000n;
        mintERC20TokensForThisUser,
        selfDelegate,
        voteForAProposalOnTokenizedBallotContract,
        getVotersVotingPower
        
    } from "../utilities/helperMethods";

async function main() {
    const publicClient = await viem.getPublicClient();

    // Get different accounts for different roles
    const [tokenDeployer, ballotDeployer, voter1, voter2] = await viem.getWalletClients();

    // Deploy MyERC20Token contract with tokenDeployer account
    const myERC20TokenContract = await viem.deployContract("MyToken", [], { account: tokenDeployer.account });
    console.log(`MyERC20Token contract deployed at ${myERC20TokenContract.address} by tokenDeployer: ${tokenDeployer.account.address}\n`);
    
    
    // Mint tokens to voter1    
    const mintTx = await mintERC20TokensForThisUser(myERC20TokenContract, voter1, tokenDeployer, publicClient);
    console.log(`Minted ${MINT_VALUE.toString()} tokens to voter1 ${voter1.account.address}\n`);
    
    // Voter1 self-delegates their voting power
    const delegateTx = await selfDelegate(myERC20TokenContract, voter1, publicClient);
    console.log(`Voter1 ${voter1.account.address} self-delegated their voting power\n`);

    // Capture the block number after minting and delegation
    const targetBlockNumber = await publicClient.getBlockNumber();
    console.log("targetBlockNumber = ", targetBlockNumber);
    
    // Deploy TokenizedBallot contract with ballotDeployer account
    const PROPOSALS = ["Proposal 0_100", "Proposal 0_200", "Proposal 0_300"];
    const tokenizedBallotContract = await viem.deployContract("TokenizedBallot", [
                                        PROPOSALS.map((prop) => toHex(prop, { size: 32 })),
                                        myERC20TokenContract.address,
                                        targetBlockNumber,
                                        ], { account: ballotDeployer.account });
    console.log(`TokenizedBallot contract deployed at ${tokenizedBallotContract.address} by ballotDeployer: ${ballotDeployer.account.address}\n`);

    // Voter1 votes on a proposal
    const voterVotingPower = await getVotersVotingPower(tokenizedBallotContract, voter1)
    console.log("voter1's voting power = ", voterVotingPower);

    console.log(`Voter1 with address ${voter1.account.address} trying to vote now`);
    const voteForProposalNumber = 1n;
    let voteWithNumberOfTokens = 100n;
    const voteTx = await voteForAProposalOnTokenizedBallotContract(tokenizedBallotContract, voteForProposalNumber, 
                                    voteWithNumberOfTokens, voter1, publicClient);
    console.log(`Voter1 ${voter1.account.address} has voted with ${voteWithNumberOfTokens} 
                                            votes on Proposal with index: ${voteForProposalNumber}\n`);        
 
    const winningProposalName = await tokenizedBallotContract.read.winnerName();
    console.log(`winning proposal is: ${hexToString(winningProposalName, { size: 32 })}`); // converting hex (aka bytes) to string
    console.log("Total proposals were: ", PROPOSALS.map( _ => _ ) );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});