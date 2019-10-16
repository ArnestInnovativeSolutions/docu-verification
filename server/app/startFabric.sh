# Exit on first error
set -e

export MSYS_NO_PATHCONV=1
starttime=$(date +%s)

CC_SRC_LANGUAGE=javascript
CC_RUNTIME_LANGUAGE=node # chaincode runtime language is node.js
CC_SRC_PATH=/opt/gopath/src/github.com/university/javascript

# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel
cd ../university-network
./start.sh

# Now launch the CLI container in order to install, instantiate chaincode
# and prime the ledger with our 10 cars
docker-compose -f ./docker-compose.yml up -d cli

docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/university.arnest.in/users/Admin@university.arnest.in/msp" cli peer chaincode install -n university -v 1.0 -p "$CC_SRC_PATH" -l "$CC_RUNTIME_LANGUAGE"
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/university.arnest.in/users/Admin@university.arnest.in/msp" cli peer chaincode instantiate -o orderer.arnest.in:7050 -C mychannel -n university -l "$CC_RUNTIME_LANGUAGE" -v 1.0 -c '{"Args":[]}' -P "OR ('UniversityMSP.member','Org2MSP.member')"
sleep 10
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/university.arnest.in/users/Admin@university.arnest.in/msp" cli peer chaincode invoke -o orderer.arnest.in:7050 -C mychannel -n university -c '{"function":"initLedger","Args":[]}'

cat <<EOF
Total setup execution time : $(($(date +%s) - starttime)) secs ...
EOF
