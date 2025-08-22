const { SogniClient } = require('@sogni-ai/sogni-client');
const { v4: uuidv4 } = require('uuid');

// Please replace with your own ID
const USERNAME = 'wangxunye8';
const PASSWORD = 'a13308358805';
const APP_ID = process.env.SOGNI_APPID || uuidv4();

let clientPromise;
async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = await SogniClient.createInstance({ appId: APP_ID, network: 'fast' });
      await client.account.login(USERNAME, PASSWORD);
      await client.projects.waitForModels();
      return client;
    })();
  }
  return clientPromise;
}

// Build the prompt string
function buildPrompt({ age, gender, species, class: charClass, location, color }) {
  return `I want to create a dungeon and dragons character card in Genesis art style. I am a ${age} years old ${gender} ${species} ${charClass} living in a ${location}, favorite color is ${color}.`;
}

async function generateCharacterCard(data) {
  try {
    const client = await getClient();
    const models = client.projects.availableModels;
    if (!models || models.length === 0) {
      console.error('No models available from Sogni Supernet.');
      throw new Error('No models available from Sogni Supernet.');
    }
    const model = models.find(m => m.id === 'coreml-sogniXL_alpha2_ws');
    if (!model) {
      throw new Error('Requested model coreml-sogniXL_alpha2_ws not found in available models.');
    }
    console.log('Selected model:', model.id, model.name);
    const prompt = buildPrompt(data);
    let project;
    try {
      // Configure API parameters like image size, count, etc.
      project = await client.projects.create({
        modelId: model.id,
        positivePrompt: prompt,
        negativePrompt: 'malformation, bad anatomy, bad hands, missing fingers, cropped, low quality, bad quality, jpeg artifacts, watermark',
        stylePrompt: '',
        steps: 20,
        guidance: 7.5,
        numberOfImages: 1,
        tokenType: 'spark'
      });
      console.log('Project created:', project.id);
      project.on('progress', (progress) => {
        console.log('Project progress:', progress);
      });
      project.on('jobCompleted', (job) => {
        console.log('Job completed:', job.id, job.resultUrl);
      });
      project.on('jobFailed', (job) => {
        console.error('Job failed:', job.id, job.error);
      });
      project.on('completed', (images) => {
        console.log('Project completed:', images);
      });
      project.on('failed', (errorData) => {
        console.error('Project failed:', errorData);
      });
    } catch (err) {
      console.error('Error creating project:', err);
      throw new Error('Failed to create project: ' + (err.message || err));
    }
    let imageUrls;
    try {
      imageUrls = await project.waitForCompletion();
      console.log('waitForCompletion result:', imageUrls);
    } catch (err) {
      console.error('Error waiting for project completion:', err);
      throw new Error('Project not found or failed: ' + (err.message || err));
    }
    if (!imageUrls || imageUrls.length === 0) {
      console.error('No image URLs returned from Sogni.');
      throw new Error('No image URLs returned from Sogni.');
    }
    return imageUrls[0];
  } catch (err) {
    console.error('generateCharacterCard error:', err);
    throw err;
  }
}

module.exports = { generateCharacterCard };