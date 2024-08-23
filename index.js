const express = require('express')
const cors = require('cors')
const multer = require('multer')
const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs').promises;
const app = express()
const path = require('path');
const port = process.env.PORT || 5000;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { log } = require('console');
require("dotenv").config();


app.use(cors())
app.use(express.json())


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash",generationConfig: {responseMimeType: "application/json" }});


//first this will execute and configure it
const storage = multer.diskStorage({
    destination: function(req,file,cb)  {
        return cb(null,'./public')
    },
    filename:function(req,file,cb) {
        return cb(null,`${file.originalname}`)
    }
})


//store it in upload variable the configuration
const upload = multer({storage})

//wen frontend sends the request to upload the file
app.post('/upload', upload.single('file'), async (req, res) => {
  const uploadedFilePath = path.resolve(req.file.path); //path where the pdf is stored
  const fileData = await fs.readFile(uploadedFilePath); //read the file
  const data = await pdfParse(fileData); //extract the text contents from the file, it stores in array along with other parameters
  const textExtracted = data.text; //extract the text from that array


  try {
            const prompt = "Provide a summary of the RFP document stricly in JSON format with and only for the keys of 'title','department','type','event_id','objective', 'description', 'date_of_release','date_of_clarification','date_of_submission','qualification_criteria','contract_term' and 'point_of_contact'. If there is no valid value for the respective key then return the value as not defined for that key. Stricly do not give any other keys in response other than which is provided in the prompt and also do not give nested array json data. Give the information accurate enough in detail without missing out on any important information. If required provide the summaru splitted in points format inside the value of the respected json keys but make sure no important information is missed out since the information you provide should be in accurate from the information provided." + textExtracted ;

            const result = await model.generateContent(prompt);
            const parsedData = JSON.parse(result.response.text())
            res.status(200).json(parsedData);


  } catch (error) {
      console.error('Failed to fetch response:', error);
      res.status(500).send('Error fetching summary from OpenAI');
  }
});


app.listen(port,()=>{
    console.log("server is running on port ",port);
    
})








