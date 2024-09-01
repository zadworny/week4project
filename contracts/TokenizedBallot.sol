// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;
/// @title Voting with delegation.

interface IMyToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

contract TokenizedBallot {
 
    struct Proposal {
        bytes32 name;   // short name (up to 32 bytes)
        uint voteCount; // number of accumulated votes
    }

    IMyToken public tokenContract;
    Proposal[] public proposals;  
    uint256 public targetBlockNumber;
    mapping(address => uint256) public spentVotePower;

    /// Create a new ballot to choose one of `proposalNames`.
    constructor(bytes32[] memory _proposalNames, address _tokenContract, uint256 _targetBlockNumber) {
        tokenContract = IMyToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;        

        // For each of the provided proposal names,
        // create a new proposal object and add it
        // to the end of the array.        
        for (uint i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({
                name: _proposalNames[i],
                voteCount: 0
            }));
        }
    }    
    
    /// Give your vote (including votes delegated to you)
    /// to proposal `proposals[proposal].name`.
    function vote(uint256 proposal, uint256 amount) external {
        uint256 voterVotingPower = getVotePower(msg.sender);        
        require(voterVotingPower >= amount, "Tokenized Ballot: Insufficient voting power!");
        spentVotePower[msg.sender] += amount;
        proposals[proposal].voteCount += amount;        
    }

    function getVotePower(address voter) public view returns(uint256 votePower_) {
        votePower_ = tokenContract.getPastVotes(voter, targetBlockNumber) - spentVotePower[voter];
    }
    
    /// @dev Computes the winning proposal taking all
    /// previous votes into account.
    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    // Calls winningProposal() function to get the index
    // of the winner contained in the proposals array and then
    // returns the name of the winner
    function winnerName() external view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
}