import { Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT) // Set the endpoint
  .setProject(process.env.PROJECT_ID); // Set the project ID

const databases = new Databases(client);

export default databases;
