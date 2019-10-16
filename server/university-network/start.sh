# Exit on first error, print all commands.
set -ev

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1

docker-compose -f docker-compose.yml down

docker-compose -f docker-compose.yml up -d ca.arnest.in orderer.arnest.in peer0.university.arnest.in ucouchdb

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
export FABRIC_START_TIMEOUT=10
#echo ${FABRIC_START_TIMEOUT}
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@university.arnest.in/msp" peer0.university.arnest.in peer channel create -o orderer.arnest.in:7050 -c mychannel -f /etc/hyperledger/configtx/mychannel.tx
# Join peer0.university.arnest.in to the channel.
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@university.arnest.in/msp" peer0.university.arnest.in peer channel join -b mychannel.block
