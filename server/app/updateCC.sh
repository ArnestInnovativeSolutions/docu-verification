# Exit on first error
set -e

export MSYS_NO_PATHCONV=1
starttime=$(date +%s)

CC_SRC_LANGUAGE=javascript
CC_RUNTIME_LANGUAGE=node # chaincode runtime language is node.js
CC_SRC_PATH=/opt/gopath/src/github.com/university/javascript

# launch network; create channel and join peer to channel
cd ../university-network

# Now launch the CLI container in order to install, instantiate chaincode
# and prime the ledger with our 10 cars
docker-compose -f ./docker-compose.yml up -d cli

echo "install"
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/university.arnest.in/users/Admin@university.arnest.in/msp" cli peer chaincode install -n university -v 2.4.2 -p "$CC_SRC_PATH" -l "$CC_RUNTIME_LANGUAGE"
echo "install done, upgrade"
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/university.arnest.in/users/Admin@university.arnest.in/msp" cli peer chaincode upgrade -n university -v 2.4.2 -p "$CC_SRC_PATH" -C mychannel -l "$CC_RUNTIME_LANGUAGE" -c '{"function":"initLedger20","Args":[]}'

echo "upgrade done, invoke"
sleep 10
docker exec -e "CORE_PEER_LOCALMSPID=UniversityMSP" -e "CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/university.arnest.in/users/Admin@university.arnest.in/msp" cli peer chaincode invoke -o orderer.arnest.in:7050 -C mychannel -n university -c '{"function":"initLedger20","Args":[]}'
echo "invoke done"

cat <<EOF
Upgrade chain code - Total setup execution time : $(($(date +%s) - starttime)) secs ...
EOF
