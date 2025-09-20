// This Node.js script acts as a backend server to receive data from an Arduino device
// via a serial port and upload it to a Firebase Firestore database.
//
// To run this file, you need to install the following dependencies:
// npm install firebase-admin @serialport/parser-readline
//
// And set up your Firebase project credentials.

// Import Firebase Admin SDK and SerialPort libraries
const admin = require('firebase-admin');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// =========================================================================
// !!! IMPORTANT: CONFIGURE YOUR FIREBASE CREDENTIALS AND SERIAL PORT !!!
// =========================================================================

// Paste your Firebase service account JSON object here.
// You can download this from your Firebase project settings -> Service Accounts.
// DO NOT COMMIT THIS FILE WITH LIVE CREDENTIALS TO A PUBLIC REPOSITORY.
const serviceAccount = {
  "type": "service_account",
  "project_id": "ir-loco-health-info-system",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDzUMME+N0ucxZr\nc6y1OgE7HzxPX4N+nwDdTDMoAl7KjiOBBJ1F0a0dhTVkJZ0sLemSuBpgIYELGrB4\nVKynAt3PFr3SJeYSbKv+AP9YH4fupueFgiyu/txQvQ3781Dr8Du4913Ht1vm+Svd\njgBWqhWh+r4MveJZjfsmTSIvBJlDQ/jXodVKSf/D/mw5+yVMQqya6wpEUXaDb7nj\n360uyQj9XmuwuofqD6dAQz0nfuBnhQxXynkXGmDWrn1jGoPoH6F5vuaZueebtu3w\nAnSkF288i1J3wlW6yoeys1RB/YDsLZIrXIFLmCpFruxhIFpuxdALeblpYBNdwasi\nuUqtJyJxAgMBAAECggEAHT+KEeDwhZLkEQqYqjhMyZSZpVjv75qhefic9aRDTMoF\nTo8FcM0hqDjJED7NQ/BI8ZAb645besA8klprXrAjha9QJiDUJUbW7fOkvi0cI/4A\nOrZJNMgCJ9pyAeVfxtzb8QIbTdSmwX8WXM2jEMflTdFcYx+4Q9ejZxlCkLBW1BTt\nphqn6nKp2FJBcCUlvA3qMw5T2EVR20ffLL0mrzd694Z62eGaJJ/nMBU8ejO9BF0w\nvQghr9CzvOuYIuZTmDUSX7FCSp60HggVOvGKJbQWRcNPIxbcapw9Cn4xbmbC2BVG\nGOAdTlcyYkgdJ82XChJNaqt3ukS6/onKFND40/HiuQKBgQD5zZpupq0QMW1+/4Me\nCw9063kK1l+B16j73LG7gmNCs8cOOl/MHl3n9DWEWIbzjIR1BAnv2R19sCwK6GHL\nEacx05sSDByBEgj63LSyFDixbOS0OQniTcPfm59kz1C03Cm1E3svYB2IrpU9egQv\n5jlibDv0cLHMbdQ3uT6XP/2Q4wKBgQD5WfVEjEMsb+wumK/cD8DTLXIp2WcQyup4\n/NXVtx2g4oiI7f0D/lImw22yEVE/lfmZ62m/5sHTLMU5RWnvzYuGTllRiPfYHk7C\n8tkhaJubPaEhMGwq2RW+8XkQYQ5fkKDw+chK4tGheinBGl0hQCt6ZMkY8tESQNDm\nS/BpTodDmwKBgQChtWhogvt7hRPF57BAbZaG8Lw9uMLA8hPRX2+q2+BX2LteSYmk\nQHA37M4MK6bI2MkSWxf3rUw7BiWstfxAkd/zEHHNQAvfvgYUJ3XN5etBaCWxSU9N\nsVvAUCTiBJbRTciuELto0sarqaCw2GEHhPjW7wvs1Fs05FBB9mg/T0xdUwKBgQCj\nEEsu+rLrGn5PspY+ySaGc4/XAk8+UhSn7mBAlLGRhtNXCJuPwv8iTmcsLdr+RCuo\nlqTfVB6o5PxNCbHPmpGF0TLj+ThrYtaK8plAGdK44MLAm5QBKVnpNqy/I1ls8X3u\nWMq8/jus5+DqYT1KA1brgYFpCVHkJ/L0x/B+TVZzxQKBgQCclKZqLs8ABeKy66gD\nKFohiFuBSASx9xemUOMpWqIaSd3+UIJvOgrJMXWJzMs1/NVoJhTER0axLBDtrkC4\nbB5B6CyYLMqI2N6cdgIHKG5/C0j5px3vTXkgd+c8MSykwN+ABU8ZrbozJMsaNRWc\nNKPRU6z0xx17Jtt5Bc8CkhPDUA==\n",
  "client_email": "firebase-adminsdk-fbsvc@ir-loco-health-info-system.iam.gserviceaccount.com",
  "client_id": "105235499101367932960",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ir-loco-health-info-system.iam.gserviceaccount.com"
};

// Replace this with the correct path to your Arduino's serial port.
// On Windows, it's typically 'COM3' or similar.
// On macOS, it's typically '/dev/tty.usbmodem141101' or similar.
// You can find this in the Arduino IDE by looking at the "Port" menu.
const portPath = 'COM3';

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get a reference to the Firestore database
const db = admin.firestore();

// Set up the serial port connection
const port = new SerialPort({ path: portPath, baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

console.log(`Listening for data on serial port: ${portPath}`);

// Listen for data from the serial port
parser.on('data', async (line) => {
  try {
    // Parse the incoming JSON string
    const data = JSON.parse(line);
    const locomotiveId = data.locomotiveId;

    if (!locomotiveId) {
      console.error('Received data without a locomotiveId. Ignoring.');
      return;
    }
    
    // Add a server-side timestamp for accuracy
    data.serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    // Reference the Firestore collection where we want to store the data
    const collectionRef = db.collection('locomotives').doc(locomotiveId).collection('sensorData');

    // Add the new sensor data document to the collection
    const docRef = await collectionRef.add(data);

    console.log(`Successfully wrote data for ${locomotiveId} to Firestore with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Failed to parse or save data:', error);
  }
});

// Handle errors
port.on('error', (err) => {
  console.error('Serial Port Error:', err.message);
  console.log('Please ensure your Arduino is connected and the port path is correct.');
});
