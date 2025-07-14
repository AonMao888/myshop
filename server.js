const express = require('express');
const admin = require('firebase-admin');
const adminfile = require('./myshop-789.json');
const cors = require('cors')

app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
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

//Add new user
app.post('/newuser', async (req, res) => {
    let data = req.body;
    if (data) {
        await db.collection('users').doc(data.uid).set(data).then(() => {
            res.json({
                status: 'success',
                text: 'New user was added.'
            })
        })
    } else {
        res.json({
            status: 'fail',
            text: 'Failed to add new user!'
        })
    }
})

app.get('/user', async (req, res) => {
    let { id } = req.query;
    if (id) {
        let da = await db.collection('users').doc(id).get();
        if (da.exists) {
            res.json({
                status: 'success',
                data: da.data()
            })
        } else {
            res.json({
                status: 'fail',
                text: 'No user found with this user ID!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'User ID was required!'
        })
    }
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

app.get('/shopbyemail', async (req, res) => {
    let { email } = req.query;
    if (email) {
        let r = await db.collection('shop').where('email', '==', email).get();
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

//Add post
app.post('/add/post', async (req, res) => {
    const postdata = req.body;
    let date = new Date();
    let hour = date.getHours();
    let min = date.getMinutes();
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let time = hour + ':' + min + '/' + day + '.' + month + '.' + year;
    db.collection('posts').add({
        text: postdata.text,
        postername: postdata.postername,
        posteremail: postdata.posteremail,
        posterimg: postdata.posterimg,
        posterid: postdata.posterid,
        time: time,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        res.json({
            status: 'success',
            text: 'Post was added.'
        })
    })
})

//All post
app.get('/allposts', async (req, res) => {
    let r = await db.collection('posts')
        .orderBy('createdAt', 'desc')
        .get();
    if (r.empty) {
        res.json({
            status: 'fail',
            text: 'Error to get posts'
        })
    } else {
        const data = [];
        r.forEach(doc => {
            const docData = doc.data();
            if (docData.createdAt && docData.createdAt instanceof admin.firestore.Timestamp) {
                docData.createdAt = docData.createdAt.toDate();
            }
            data.push({ id: doc.id, ...docData })
        });
        res.json({
            status: 'success',
            data: data
        })
    }
})

//get post item
app.get('/post/:id', async (req, res) => {
    let { id } = req.params;
    if (id) {
        let r = await db.collection('posts').doc(id).get();
        if (r.empty) {
            res.json({
                status: 'fail',
                text: "This post isn't existed!"
            })
        } else {
            let all = r.data()
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

//get post by poster id
app.get('/postbyposter/:id', async (req, res) => {
    let { id } = req.params;
    if (id) {
        let r = await db.collection('posts').where('posterid', '==', id).get();
        if (r.empty) {
            res.json({
                status: 'fail',
                text: "No post!"
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

//delete post
app.post('/post/delete', async (req, res) => {
    let data = req.body;
    console.log(data);

    if (data) {
        await fetch('https://myshop-tau-two.vercel.app/post/' + data.postid).then(r => r.json()).then(async (as) => {
            if (as.status === 'success') {
                if (data.requester === as.data.posterid) {
                    await db.collection('posts').doc(data.postid).delete().then(() => {
                        res.json({
                            status: 'success',
                            text: 'Post was successfully deleted.'
                        })
                    })
                } else {
                    res.json({
                        status: 'fail',
                        text: 'No permission to delete post!'
                    })
                }
            } else {
                res.json({
                    status: 'fail',
                    text: as.text
                })
            }
        })
    } else {
        res.json({
            status: 'fail',
            text: 'No permission to add data!'
        })
    }
})

//add new data to contact
app.post('/contact/add', async (req, res) => {
    let data = req.body;
    if (data) {
        let d = await db.collection('shop').doc(data.shopid).get();
        if (d.exists) {
            let shopdata = d.data();
            if (shopdata.ownerid == data.posterid) {
                let addref = db.collection('shop').doc(data.shopid);
                try {
                    await addref.update({
                        [`contact.${data.contacttype}`]: data.new
                    }).then(() => {
                        if (data.isupdate === true) {
                            res.json({
                                status: 'success',
                                text: 'Data was updated.'
                            });
                        } else {
                            res.json({
                                status: 'success',
                                text: 'Data was added.'
                            });
                        }
                    })
                } catch (e) {
                    res.json({
                        status: 'fail',
                        text: 'No permission to add data!'
                    })
                }
            } else {
                res.json({
                    status: 'fail',
                    text: 'No permission to add data!'
                })
            }
        } else {
            res.json({
                status: 'fail',
                text: 'No shop found with this ID.'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Failed to add data.'
        })
    }
})

//add new data to another contact
app.post('/contact/addanother', async (req, res) => {
    let data = req.body;
    if (data) {
        let d = await db.collection('shop').doc(data.shopid).get();
        if (d.exists) {
            let shopdata = d.data();
            if (shopdata.ownerid == data.posterid) {
                let addref = db.collection('shop').doc(data.shopid);
                try {
                    await addref.update({
                        [`anothercontact.${data.appname}`]: {
                            appname: data.appname,
                            applink: data.applink,
                            labelcolor: data.labelcolor
                        }
                    }).then(() => {
                        if (data.isupdate === true) {
                            res.json({
                                status: 'success',
                                text: 'Data was updated.'
                            });
                        } else {
                            res.json({
                                status: 'success',
                                text: 'Data was added.'
                            });
                        }
                    })
                } catch (e) {
                    res.json({
                        status: 'fail',
                        text: 'No permission to add data!'
                    })
                }
            } else {
                res.json({
                    status: 'fail',
                    text: 'No permission to add data!'
                })
            }
        } else {
            res.json({
                status: 'fail',
                text: 'No shop found with this ID.'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Failed to add data.'
        })
    }
})

//delete another account
app.post('/delanotheraccount', async (req, res) => {
    let data = req.body;
    let d = await db.collection('shop').doc(data.shopid).get();
    let da = d.data();
    if (data.posterid === da.ownerid) {
        let path = `anothercontact.${data.appname}`;
        await db.collection('shop').doc(data.shopid).update({
            [path]: admin.firestore.FieldValue.delete()
        }).then(() => {
            res.json({
                status: 'success',
                text: 'Account was successfully deleted.'
            })
        })
    } else {
        res.json({
            status: 'fail',
            text: 'No permission to delete!'
        })
    }
})

//add shop location
app.post('/addlocation', async (req, res) => {
    let data = req.body;
    if (data) {
        let d = await db.collection('shop').doc(data.shopid).get();
        let da = d.data();
        if (data.posterid === da.ownerid) {
            await db.collection('shop').doc(data.shopid).update({
                lat: data.lat,
                long: data.long
            }).then(() => {
                res.json({
                    status: 'success',
                    text: 'Account was successfully deleted.'
                })
            }).catch(e => {
                res.json({
                    status: 'fail',
                    text: 'Fail to add data!'
                })
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'No data!'
        })
    }
})

//add review
app.post('/add/review', async (req, res) => {
    let data = req.body;
    if (data) {
        let shopdata = await db.collection('shop').doc(data.shopid).get();
        if (shopdata.exists) {
            let da = shopdata.data();
            if (da.shopname === data.shopname) {
                let date = new Date();
                let hour = date.getHours();
                let min = date.getMinutes();
                let day = date.getDate();
                let month = date.getMonth();
                let year = date.getFullYear();
                let time = hour + ':' + min + '/' + day + '.' + month + '.' + year;
                await db.collection('reviews').doc(data.shopid).set({
                    [data.posterid]: {
                        text: data.text,
                        posterid: data.posterid,
                        postername: data.postername,
                        posterimg: data.posterimg,
                        posteremail: data.posteremail,
                        shopname: data.shopname,
                        shopid: data.shopid,
                        time: time,
                        fulltime: admin.firestore.FieldValue.serverTimestamp()
                    }
                }).then(() => {
                    res.json({
                        status: 'success',
                        text: 'Review was successfully added.'
                    })
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'There have error to submit!'
                })
            }
        } else {
            res.json({
                status: 'fail',
                text: 'No shop found with this ID!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Unable to add data!'
        })
    }
})

//get reviews messages
app.get('/get/review/:id', async (req, res) => {
    let { id } = req.params;
    let data = await db.collection('reviews').doc(id).get();
    if (data.exists) {
        let reviewdata = data.data();
        res.json({
            status: 'success',
            data: reviewdata
        })
    } else {
        res.json({
            status: 'fail',
            text: 'No data found!'
        })
    }
})

//delete review
app.post('/delete/review/:id', async (req, res) => {
    let data = req.body;
    if (data) {
        let dd = await db.collection('reviews').doc(data.shopid).get();
        if (dd.exists) {
            let shopreview = dd.data();
            if (shopreview[data.requesterid]) {
                await db.collection('reviews').doc(data.shopid).update({
                    [data.requesterid]: admin.firestore.FieldValue.delete()
                }).then(() => {
                    res.json({
                        status: 'success',
                        text: 'Your review was successfully deleted.'
                    })
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'You have no review to delete!'
                })
            }
        } else {
            res.json({
                status: 'fail',
                text: 'No shop found with this ID!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'No data found to delete review!'
        })
    }
})

app.listen(80, () => {
    console.log('server started with port 80');
})