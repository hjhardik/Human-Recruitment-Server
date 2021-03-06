//import all required modules
const express = require("express");
const bodyParser = require("body-parser"); //body-parser
const mongoose = require("mongoose"); //for mongodb database
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
var qs = require('qs');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({origin: '*'}));

//DB Config
const db = require("./config/keys").mongoURI;

// Connect to MongoDB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));


//models
const User = require("./models/User");
const Contract = require("./models/Contract");
const CopyContract = require("./models/CopyContract");
const Annotation = require("./models/Annotation");

//require editing functions
const createPdf = require('./createPdfFromDynamic');
const reorderPage = require('./reorderPage.js');
const deletePage = require('./deletePage.js');

//require all editing functions
const clientID = require('./config/signApi').clientID
const clientSecret = require('./config/signApi').clientSecret
const redirectUrl = require('./config/signApi').redirectURL


//findUser
const findUser = async (userName, password, candidate) => {
  let user = await User.findOne({
    userName,
    password,
    candidate,
  });
  if(user){
    return user
  }else{
    return null
  }
}

//register user
const registerUser = async (userName, fullName, password, company, candidate) => {
  let alreadyUser = await User.findOne({ userName, company, candidate })
  if(alreadyUser){
      return null
    }else{
      const newUser = await new User({
        userName,
        password,
        candidate,
        fullName,
        company,
      });
      return await newUser.save()
      }
  }

//findCompanyMembers
const findCompanyMembers = async (company) => {
  return await User.find({
    company,
    candidate: true,
  },{fullName:1})
}

//find Contracts created by(candidate=false)/for(candidate=true) this userName
const findContracts = async(userName, company, candidate) => {
  if(candidate==="true"){
    return await CopyContract.find({
      candidateName: userName,
      company,
    }).sort({date:-1})
  }else{
    let mainContracts =  await Contract.find({
      creator: userName,
      company,
    }).sort({date:-1});
    let mainContract, contract, memName, allContracts = [];
    if(mainContracts !== null){
     for(i=0; i< mainContracts.length; i++){
      mainContract = mainContracts[i];
      for(j=0; j< mainContract.members.length; j++){ 
        memName = mainContract.members[j];
        contract = await CopyContract.findOne({
                      contractName: mainContract.contractName,
                      creator: userName,
                      company,
                      candidateName: memName,
                    })
        if(contract !== null) allContracts.push(contract)
      }  
     }
    }
    return allContracts
  }
}

//register contract done
const registerContract = async (userName, company, contractName, selectedMembers) => {
  let contract = await Contract.findOne({contractName, creator:userName, company})
  if(contract){
    return null
  }else{
    let newContract = await new Contract({
      contractName,
      creator: userName, 
      company, 
      members: selectedMembers,
    });
    return await newContract.save()
  }
};

//register copy contract done
const registerCopyContract = async (user, company, member, contractName, draftContent, pdfName) => {
  const newCopyContract = await new CopyContract({
    creator: user,
    company,
    candidateName: member,
    contractName,
    draftContent,
    pdfName
  })
  return await newCopyContract.save()
}


// Routes
//login
app.post('/login', async (req,res)=>{
  let {userName, password, candidate} = req.body;
  let user = await findUser(userName.trim(), password, candidate)
  if(user==null){
    res.json({
      success: false,
      msg: "Account not found. Please enter correct credentials.",
      token: null,
    });
  }else{
    res.json({
      success: true,
      msg: "login successful",
      token: "loginToken",
      user: user.userName,
      candidate: user.candidate,
      company: user.company,
    });
  }  
})

//register
app.post('/register', async (req,res)=>{
  let {userName, fullName, password, companyName, candidate} = req.body;
  let user = await registerUser(userName.trim(), fullName.trim(), password, companyName.trim(), candidate)
  if (user == null){
    res.json({
      success: false,
      msg: "Username already exists. Please use different user name.",
      token: null,
    });
  }else{
    res.json({
      success: true,
      msg: "login successful",
      token: "loginToken",
      user: user.userName,
      candidate: user.candidate,
      company: user.company,
    });
  }
});

//contracts
app.post('/contracts', async (req,res) => {
  let {user, company, candidate} = req.body;
  let contracts = []
    contracts = await findContracts(user.trim(), company.trim(), candidate);
    res.send(
    contracts
  )  
});

//edit contracts
app.post('/editcontract', async(req,res) => {
  let {creator, candidate, company, contract, draftContent} = req.body;
  let pdfStatus = await createPdf(creator, company, candidate, contract, draftContent, `${contract}_${candidate}`);  
  if(pdfStatus.success){
    let success = await CopyContract.findOneAndUpdate(
      { candidateName: candidate, creator, contractName: contract },
      { "$set": { "draftContent": draftContent,}},
      (err) => {
        if (err) {
          res.json({
            success: false,
            msg:"Error occurred. Please try again.",
          })
        }
      }
    );
    res.json({
      success: true,
      msg:''
    })
  }else{
    res.json({
      success: false,
      msg:'Error occured in updating contract. Please try again.'
    })
  } 
});

//reorder 
app.post('/editcontract/reorderDelete', async(req,res) => {
  let {candidate,contract, SP, EP, id} = req.body;
  if(id===0){
    let status = await deletePage(`${contract}_${candidate}`, Number(SP), Number(EP))
    if(status){
      res.json({
        success: true,
        msg:'',
      })
    }else{
      res.json({
        success: false,
        msg:'Cannot reorder specified pages.',
      })
    }
  }else{
    let status = reorderPage(`${contract}_${candidate}`, Number(SP), Number(EP));
    if(status){
        res.json({
          success: true,
          msg:'',
        })
    }else{
      res.json({
        success: false,
        msg:'Cannot reorder specified pages.',
      })
    }
  }
});

//find draft content
app.post('/finddraftcontent', async(req,res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let {candidate, contract} = req.body;
  let content = await CopyContract.findOne({contractName: contract, candidateName: candidate},{_id:0, draftContent:1})
  if(content !== null) res.json({success: true,content: content.draftContent});
  else res.json({success: false, content: null})
});

//modify status of contract
app.post('/modifystatus', async(req,res) => {
  let {creator, candidate, contract, status} = req.body;
  //status=10 denotes delete operation
  if(status === 10){
    CopyContract.deleteOne({candidateName: candidate, creator, contractName: contract }).then(()=>{
      if(fs.existsSync(`./output/${contract}_${candidate}.pdf`)) fs.unlinkSync(`./output/${contract}_${candidate}.pdf`)
      res.json({
        success: true,
        msg:''
      })
    }).catch(e => {
      res.json({
        success: false,
        msg:e
      })
    })
  }else{
    let success = await CopyContract.findOneAndUpdate(
      { candidateName: candidate, creator, contractName: contract },
      { "$set": { "status": status,}},
      (err) => {
        if (err) {
          res.json({
            success: false,
            msg:"Error occurred. Please try again.",
          })
        }
      }
    );
    res.json({
      success: true,
      msg:''
    })
  }
});

//sign api redirection
app.post('/signauth/redirect', async (req,res) => {

  let {contract, candidate, email, code, state, api_access_point } = req.body; 
  let contractF = contract;
  let candidateF = candidate;
  let emailF = email;
   //NOW SEND POST REQ TO TOKEN ENDPOINT
  if (code !== null && code !== undefined) {  
    let contract = state.split("__")[0];
    let candidate = state.split("__")[1];
    let email = state.split("__")[2];
 
  var data = qs.stringify({
    'code': code,
    'client_id': clientID,
    'client_secret': clientSecret,
    'redirect_uri': redirectUrl,
    'grant_type': 'authorization_code', 
  });
  var config = {
    method: 'post',
    url: "https://api.adobesign.com/oauth/token",
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : data
  };

  let fetchedData = await axios(config)
    .then(function (response) {
      return (JSON.stringify(response.data));
    })
    .catch(function (error) {
      res.json({
        success: false,
        msg: error
      })
    });
    
  
  let access_token = JSON.parse(fetchedData).access_token
  let refresh_token = JSON.parse(fetchedData).refresh_token

  if(access_token == undefined || access_token==null){
    res.json({
      success: false,
      msg: 'Could not generate access token.'
    })
  }

  var data = new FormData();
  try {
    data.append('File', fs.createReadStream(`./output/${contract}_${candidate}.pdf`));
  } catch (error) {
    res.json({
      success: false,
      msg: "The created contract file was deleted due to free tier server usage."
    })
  }
  
  var config = {
    method: 'post',
    url: `${api_access_point}api/rest/v6/transientDocuments`,
    headers: { 
      'Authorization': `Bearer ${access_token}`, 
      ...data.getHeaders()
    },
    data : data
  };

  axios(config)
  .then(function (response) {
    let transientDocumentId = response.data.transientDocumentId;

    var newData = JSON.stringify({"fileInfos":[{"transientDocumentId":`${transientDocumentId}`}],"name":`${contract}`,"participantSetsInfo":[{"memberInfos":[{"email":`${email}`}],"order":1,"role":"SIGNER"}],"signatureType":"ESIGN","state":"IN_PROCESS"});

    var newConfig = {
      method: 'post',
      url: `${api_access_point}api/rest/v6/agreements`,
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${access_token}`
      },
      data : newData
    };
    axios(newConfig)
    .then(async function (response) {
      let agreementId = response.data.id
      var cnfg = {
        method: 'get',
        url: `${api_access_point}api/rest/v6/agreements/${agreementId}/signingUrls`,
        headers: { 
          'Authorization': `Bearer ${access_token}`
        }
      };

      await axios(cnfg)
      .then(async function (response) {
        let signingUrl = response.data.signingUrlSetInfos[0].signingUrls[0].esignUrl;
        await CopyContract.findOneAndUpdate(
          { candidateName: candidate, contractName: contract },
          { "$set": { "signingUrl": signingUrl,"agreementId": agreementId, "status": 5}},
          (err) => {
            if (err) {
              res.json({
                success: false,
                msg:"Cannot update signing url.",
              })
            }
          }
        );
        res.json({
          success: true,
          msg:"Updated agreement id",
        });

      }).catch(e => {
      axios(cnfg)
      .then(async function (response) {
        let signingUrl = response.data.signingUrlSetInfos[0].signingUrls[0].esignUrl;
        await CopyContract.findOneAndUpdate(
          { candidateName: candidate, contractName: contract },
          { "$set": { "signingUrl": signingUrl,"agreementId": agreementId, "status": 5}},
          (err) => {
            if (err) {
              res.json({
                success: false,
                msg:"Cannot update signing url.",
              })
            }
          }
        );
        res.json({
          success: true,
          msg:"Updated agreement id",
        });

      }).catch(e =>{
        console.log(e)
        res.json({
          success: false,
          msg: "Error occured while creating signing url."
        })
      })
  })
})
})
  .catch(e => {
    res.json({
      success: false,
      msg: "Error occured while creating agreement. Please try again."
    })
  })
  }else{
    let url = `https://secure.na1.adobesign.com/public/oauth?redirect_uri=${redirectUrl}&response_type=code&client_id=${clientID}&scope=user_login:self+agreement_read:self+agreement_write:self+agreement_send:self&state=${contractF}__${candidateF}__${emailF}`;
    res.json({
      success: true,
      data: url,
    });
  }
})

//find all the company members
app.post('/findCompanyMembers', async (req,res) => {
  let company = req.body.company;
  let candidates = await findCompanyMembers(company)
  let candidateNames=[];
  candidates.forEach((candidate)=>{
    candidateNames.push(candidate.fullName)
  })
  res.send(
    candidateNames 
  )
})

//create draft route
app.post('/createDraft', async (req,  res) => {
  let {user, company, contractName, selectedMembers, draftContent} = req.body;
  let createdContracts = [];
  let cont;
  let contract = await registerContract(user, company, contractName, selectedMembers);
  if(contract == null){
    res.json({
      success: false,
      newContracts: null,
      msg:"Contract with same name created by you is already present"
  })
}else{
  let success;
    for(i=0; i< selectedMembers.length; i++){
      member = selectedMembers[i]
      success = await createPdf(user, company, member, contractName, draftContent, `${contractName}_${member}`);
      if(success.success){
        cont = await registerCopyContract(user, company, member, contractName, draftContent, `${contractName}_${member}`)
        createdContracts.push(cont)
      }else{
        break
      }
    }
      if(success.success){
        res.json({
          success: true,
          newContracts: createdContracts,
          msg:"",
      })
      }else{
        Contract.deleteOne({contractName, creator:user, company}).then(()=>{       
        res.json({
          success: false,
          newContracts: null,
          msg: "Server Error",
        })
      })
    }      
  }
});

// PDF LOCATION
app.get('/viewpdf/:pdfLocation', (req,res)=>{
  var tempFile=`./output/${req.params.pdfLocation}.pdf`;
  fs.readFile(tempFile, function (err,data){
     res.contentType("application/pdf");
     res.send(data);
  })
});

//find annotations present in the contract
app.post("/copycontract/annotations/find", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let reqFile = req.body.fileId;
  if (reqFile == "" || reqFile === undefined) {
    res.send(null);
  } else {
    //finds all annotations with same fileId
    Annotation.find({ fileId: reqFile })
      .select({ _id: 0, data: 1 })
      .exec((err, annos) => {
        if (!err) {
          res.send(annos);
        } else {
          res.send('cannot find annotation with file id')
        }
      });
  }
});

//add annotations route
app.post("/copycontract/annotations/add", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let data = req.body.data;
  let fileName = req.body.fileId;
  if (data == "" || fileName == "" || data == undefined) {
    res.send(null);
  } else {
    let id = data.id;
    Annotation.findOne({ id: id, fileId: fileName }).then((anno) => {
      //checks if already not present, then creates one
      if (!anno) {
        let ano = new Annotation({
          id: id,
          fileId: fileName,
          data: data,
        });
        ano.save();
      }
    });
    res.send('success');
  }
});
//update annotations route
app.post("/copycontract/annotations/update", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let data = req.body.data;
  let fileName = req.body.fileId;
  let id = data.id;
  //find annos from DB by fileId and then updates it
  Annotation.findOneAndUpdate(
    { id: id, fileId: fileName },
    { "data.bodyValue": data.bodyValue },
    (err) => {
      if (err) {
      }
    }
  );
  res.sendStatus(200);
});

//delete annonations route
app.post("/copycontract/annotations/delete", async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let data = req.body.data;
  let fileName = req.body.fileId;
  let id = data.id;
  //finds annos by _id and then deletes it from DB
  await Annotation.deleteOne({ id: id, fileId: fileName }, (err) => {
    if (err) {
    }
  });
  res.sendStatus(200);
});

//port
const PORT = process.env.PORT || 8080;
//start server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
