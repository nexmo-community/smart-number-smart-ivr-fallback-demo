// Environment Variables
// **********
// CALLER_ID - The caller ID used for outbound connections
// DEST_TYPE - The type of connection to connect the hotline to
// DEST_NUMBER - The PSTN number to connect. This is used when DEST_TYPE is set to 'phone'
// DEST_EXT - The Vonage Business Cloud extension number to connect. This is used when DEST_TYPE is set to 'vbc'
// DEST_SIP - The SIP URI to connect. This is used when DEST_TYPE is set to 'sip'
// FALLBACK_TYPE - The type of connection to connect the hotline to
// FALLBACK_NUMBER - The PSTN number to connect. This is used when FALLBACK_TYPE is set to 'phone'
// FALLBACK_EXT - The Vonage Business Cloud extension number to connect. This is used when FALLBACK_TYPE is set to 'vbc'
// FALLBACK_SIP - The SIP URI to connect. This is used when FALLBACK_TYPE is set to 'sip'
// VOICE_NAME - Nexmo voice to use for text-to-spech
// PORT - The port the application should listen on
require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = process.env.PORT || 3000
const callerId = process.env.CALLER_ID

const voiceName = process.env.VOICE_NAME || "Amy";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.redirect('/answer')
})

app.post('/event', (req, res) => {
  var ncco = []

  if(['timeout','unanswered'].includes(req.body.status)){
    var endpoints = []

    switch(process.env.FALLBACK_TYPE) {
      case 'phone':
        endpoints.push({type: 'phone', number: process.env.FALLBACK_NUMBER})
        break
      case 'vbc':
        endpoints.push({type: 'vbc', extension: process.env.FALLBACK_EXT})
        break
      case 'sip':
        endpoints.push({type: 'sip', uri: process.env.FALLBACK_SIP})
        break
    }

    ncco.push({
      action: "connect",
      from: callerId,
      endpoint: endpoints
    })
  } else {
    ncco.push({})
  }

  res.json(ncco)
})

app.get('/answer', (req, res) => {
  var ncco = [{
   action: "talk",
   voiceName: voiceName,
   text: "Thank you for calling the Smart IVR Fallback Demo! Stay on the line while we connect you."
  }]

  endpoints = []

  switch(process.env.DEST_TYPE) {
    case 'phone':
      endpoints.push({type: 'phone', number: process.env.DEST_NUMBER})
      break
    case 'vbc':
      endpoints.push({ type: 'vbc', extension: process.env.DEST_EXT})
      break
    case 'sip':
      endpoints.push({type: 'sip', uri: process.env.DEST_SIP})
      break
  }

  ncco.push({
    action: 'connect',
    timeout: 3,
    from: callerId,    
    eventType: "synchronous",
    eventUrl: [`${req.protocol}://${req.get('host')}/event`],
    endpoint: endpoints
  })

  res.json(ncco)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
