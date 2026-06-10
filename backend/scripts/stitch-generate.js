const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const args = process.argv.slice(2);
  let prompt = '';
  let outfile = 'stitch-latest.html';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' || args[i] === '-p') {
      prompt = args[i + 1];
      i++;
    } else if (args[i] === '--outfile' || args[i] === '-o') {
      outfile = args[i + 1];
      i++;
    }
  }

  if (!prompt) {
    console.error('Error: Please provide a prompt with --prompt or -p');
    process.exit(1);
  }

  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    console.error('Error: STITCH_API_KEY not found in environment or .env');
    process.exit(1);
  }

  // Set the environment variable for the SDK if needed, or check if it needs to be explicitly passed.
  // The SDK checks process.env.STITCH_API_KEY by default.
  process.env.STITCH_API_KEY = apiKey;

  console.log(`Loading @google/stitch-sdk dynamically...`);
  const { stitch } = await import('@google/stitch-sdk');

  console.log(`Initializing Stitch project 'SplitCampus'...`);
  let project;
  try {
    // Attempt to create the project. If it exists, use the existing project reference.
    project = await stitch.createProject("SplitCampus");
    console.log(`Created new Stitch project: SplitCampus (ID: ${project.id})`);
  } catch (err) {
    console.log(`Project may already exist or cannot be created. Accessing 'SplitCampus' project...`);
    project = stitch.project("SplitCampus");
  }

  console.log(`Generating UI for prompt: "${prompt}"...`);
  const screen = await project.generate(prompt);
  console.log(`Screen generated successfully.`);

  console.log(`Retrieving HTML URL...`);
  const htmlUrl = await screen.getHtml();
  console.log(`HTML URL: ${htmlUrl}`);

  console.log(`Downloading HTML content...`);
  const response = await fetch(htmlUrl);
  if (!response.ok) {
    throw new Error(`Failed to download HTML: ${response.statusText}`);
  }
  const htmlContent = await response.text();

  const outPath = path.isAbsolute(outfile) ? outfile : path.join(__dirname, outfile);
  
  // Make sure target directory exists
  const targetDir = path.dirname(outPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(outPath, htmlContent, 'utf8');
  console.log(`Successfully saved HTML layout to: ${outPath}`);
}

main().catch(err => {
  console.error('Error occurred during screen generation:', err);
  process.exit(1);
});
