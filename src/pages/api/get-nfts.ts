import type { NextApiRequest, NextApiResponse } from "next";
import {
  ThirdwebSDK,
  //@ts-ignore
  NFTMetadataOwner,
  PayloadToSign721,
} from "@thirdweb-dev/sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const PRIVATE_KEY = process.env.NEXT_PUBLIC_METAMASK_PRIVATE_KEY as string;
  const COLLECTION_ADDRESS = process.env
    .NEXT_PUBLIC_COLLECTION_ADDRESS as string;
  let nfts = [
    {
      id: 0, // Unique ID for each NFT corresponding to its position in the array
      name: "test #0001", // A name for the NFT
      description: "", // Description for the NFT
      url: "https://gateway.ipfscdn.io/ipfs/QmcV9DgiC8acnuwNFsGDvSJt8v9GeBQkF3H1HMXjSHSzCo/0.png", // URL for the NFT image
      price: 0, // The price of the NFT
      minted: false, // A variable to indicate if the NFT has been minted
    },
    {
      id: 1, // Unique ID for each NFT corresponding to its position in the array
      name: "test #0002", // A name for the NFT
      description: "This is our first amazing NFT", // Description for the NFT
      url: "https://gateway.ipfscdn.io/ipfs/QmbckYbYB2e1Dx3mNGN15p6Howmj1MdjZ2vQyUT8bWEMQo/1.png", // URL for the NFT image
      price: 0, // The price of the NFT
      minted: false, // A variable to indicate if the NFT has been minted
    },
    {
      id: 2, // Unique ID for each NFT corresponding to its position in the array
      name: "test #0003", // A name for the NFT
      description: "This is our first amazing NFT", // Description for the NFT
      url: "https://bafybeihgfxd5f5sqili34vyjyfai6kezlagrya43e6bkgw6hnxucxug5ya.ipfs.nftstorage.link/", // URL for the NFT image
      price: 0.01, // The price of the NFT
      minted: false, // A variable to indicate if the NFT has been minted
    },
    // Add more NFTs here...
  ];

  // Connect to SDK
  const sdk = ThirdwebSDK.fromPrivateKey(
    // Learn more about securely accessing your private key: https://portal.thirdweb.com/web3-sdk/set-up-the-sdk/securing-your-private-key
    PRIVATE_KEY,
    "goerli"
  );

  // Set variable for the NFT collection contract address which can be found after creating an NFT collection in the dashboard
  const nftCollectionAddress = COLLECTION_ADDRESS;

  // Initialize the NFT collection with the contract address
  // const nftCollection = await sdk.getNFTCollection(nftCollectionAddress);
  const nftCollection = await sdk.getContract(
    nftCollectionAddress,
    "nft-collection"
  );

  switch (req.method) {
    case "GET":
      try {
        const mintedNfts: NFTMetadataOwner[] = await nftCollection?.getAll();

        if (!mintedNfts) {
          res.status(200).json(nfts);
        }

        mintedNfts.forEach((nft) => {
          if (nft.metadata.attributes) {
            const positionInMetadataArray = nft.metadata.attributes.id;
            nfts[positionInMetadataArray].minted = true;
          }
        });
      } catch (error) {
        console.error(error);
      }
      res.status(200).json(nfts);
      break;
    case "POST":
      // Get ID of the NFT to mint and address of the user from request body
      const { id, address } = req.body;

      // Ensure that the requested NFT has not yet been minted
      if (nfts[id].minted === true) {
        res.status(400).json({ message: "Invalid request" });
      }

      // Allow the minting to happen anytime from now
      // const startTime = new Date(0);
      const startTime = new Date();
      const endTime = new Date(Date.now() + 60 * 60 * 24 * 1000);

      // Find the NFT to mint in the array of NFT metadata using the ID
      const nftToMint = nfts[id];

      // Set up the NFT metadata for signature generation
      const payload: PayloadToSign721 = {
        metadata: {
          name: nftToMint.name,
          description: nftToMint.description,
          image: nftToMint.url,
          // Set the id attribute which we use to find which NFTs have been minted
          attributes: { id },
        },
        price: nftToMint.price,
        // currencyAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        mintStartTime: startTime,
        // mintEndTime: endTime,
        to: address,
      };
      try {
        const response = await nftCollection?.signature.generate(payload);
        // Respond with the payload and signature which will be used in the frontend to mint the NFT
        res.status(201).json(response);
        // res.status(201).json({
        //   payload: response?.payload,
        //   signature: response?.signature,
        // });
      } catch (error) {
        res.status(500).json({ error });
        console.error(error);
      }
      break;
    default:
      res.status(200).json(nfts);
  }
}
