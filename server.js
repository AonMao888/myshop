const express = require('express');
const admin = require('firebase-admin');
const adminfile = require('./myshop-789.json');
const cors = require('cors')

app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: '*'
}));

admin.initializeApp({
    credential: admin.credential.cert(adminfile)
});
const db = admin.firestore();

app.get('/', (req, res) => {
    res.send('home')
})

//Show all shop
app.get('/allshop', async (req, res) => {
    let r = await db.collection('shop').get();
    let all = r.docs.map((d) => ({
        id: d.id,
        ...d.data()
    }))
    res.json({
        status: 'success',
        data: all
    })
})

//Specific shop by id
app.get('/shop', async (req, res) => {
    let { id } = req.query;
    if (id) {
        let r = await db.collection('shop').where('shopid', '==', id).get();
        if (r.empty) {
            res.json({
                status: 'fail',
                text: "This shop isn't existed!"
            })
        } else {
            let all = r.docs.map((d) => ({
                id: d.id,
                ...d.data()
            }))
            res.json({
                status: 'success',
                data: all
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Shop ID required!'
        })
    }
})

app.listen(80, () => {
    console.log('server started with port 80');
})