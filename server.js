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

//update shop data
app.post('/update/shop', async (req, res) => {
    let data = req.body;
    if (data.uid) {
        let t = await db.collection('shop').where('shopid', '==', data.currentshopid).get();
        if (!t.empty) {
            let gotshop = t.docs[0].data();
            if (gotshop.ownerid === data.uid) {
                await t.docs[0].ref.update({
                    shopname: data.shopname,
                    logo: data.logo,
                    shoptype: data.shoptype,
                    shopdes: data.shopdes,
                    city: data.city,
                    email: data.email,
                    shopid: data.shopid
                }).then(() => {
                    res.json({
                        status: 'success',
                        text: 'Shop data was updated!'
                    })
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'You have no permission to update data!'
                })
            }
        } else {
            res.json({
                status: 'fail',
                text: 'This shop is not exists!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Unable to update shop data!'
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
        shopdocid:postdata.shopdocid,
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
        let d = await db.collection('shop').where('shopid', '==', data.shopid).get();
        if (!d.empty) {
            let shopdata = d.docs[0].data();
            if (shopdata.ownerid == data.posterid) {
                try {
                    let addref = db.collection('shop').where('shopid', '==', data.shopid).get().then(async (querysnap) => {
                        let doc = querysnap.docs[0];
                        await doc.ref.update({
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
                    });

                } catch (e) {
                    res.json({
                        status: 'fail',
                        text: 'Unable to add data!'
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
        let d = await db.collection('shop').where('shopid', '==', data.shopid).get();
        if (!d.empty) {
            let shopdata = d.docs[0].data();
            if (shopdata.ownerid == data.posterid) {
                let addref = d.docs[0].ref
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
    let d = await db.collection('shop').where('shopid', '==', data.shopid).get();
    let da = d.docs[0].data();
    if (data.posterid === da.ownerid) {
        let path = `anothercontact.${data.appname}`;
        await d.docs[0].ref.update({
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
        let d = await db.collection('shop').where('shopid', '==', data.shopid).get();
        let da = d.docs[0].data();
        if (data.posterid === da.ownerid) {
            await d.docs[0].ref.update({
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
        let shopdata = await db.collection('shop').where('shopid', '==', data.shopid).get();
        if (!shopdata.empty) {
            let da = shopdata.docs[0].data();
            if (da.shopname === data.shopname) {
                let date = new Date();
                let hour = date.getHours();
                let min = date.getMinutes();
                let day = date.getDate();
                let month = date.getMonth();
                let year = date.getFullYear();
                let time = hour + ':' + min + '/' + day + '.' + month + '.' + year;
                let docid = data.shopdocid + data.posterid;
                console.log(docid);
                await db.collection('reviews').doc(docid).set({
                    text: data.text,
                    posterid: data.posterid,
                    postername: data.postername,
                    posterimg: data.posterimg,
                    posteremail: data.posteremail,
                    shopname: data.shopname,
                    shopid: data.shopid,
                    shopdocid:shopdata.docs[0].id,
                    time: time,
                    fulltime: admin.firestore.FieldValue.serverTimestamp()

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
    let data = await db.collection('reviews').where('shopdocid','==',id).get();
    if (!data.empty) {
        let reviewdata = await data.docs.map((docc)=>({
            id:docc.id,
            ...docc.data()
        }));
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
    let {id} = req.params;
    let data = req.body;
    if (data) {
        let dd = await db.collection('reviews').doc(id).get();
        if (dd.exists) {
            let shopreview = dd.data();
            if (shopreview.posterid === data.requesterid) {
                await db.collection('reviews').doc(id).delete().then(() => {
                    res.json({
                        status: 'success',
                        text: 'Your review was successfully deleted.'
                    })
                })
            } else {
                res.json({
                    status: 'fail',
                    text: 'You have no permission to delete!'
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

//get all miniapp
app.get('/miniapp', async (req, res) => {
    let all = await db.collection('miniapp').get();
    let f = all.docs.map((d) => ({
        id: d.id,
        ...d.data()
    }));
    res.json({
        status: 'success',
        data: f
    })
})

//get specific miniapp
app.get('/miniapp/:id', async (req, res) => {
    let { id } = req.params;
    if (id) {
        let all = await db.collection('miniapp').doc(id).get();
        if (all.exists) {
            let da = all.data()
            res.json({
                status: 'success',
                data: da
            })
        } else {
            res.json({
                status: 'fail',
                text: 'No App found with this ID!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'No ID found to get miniapp data.'
        })
    }
})

//send request
app.post('/request/shop', async (req, res) => {
    let data = req.body;
    if (data.uid) {
        await db.collection('requests').doc(data.uid).set({
            shopname: data.shopname,
            shoptype: data.shoptype,
            shopdes: data.shopdes,
            city: data.city,
            ownername: data.username,
            ownerid: data.uid,
            ownerimg: data.profile,
            owneremail: data.email,
            status: 'none',
            time: admin.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            res.json({
                status: 'success',
                text: 'Your request was successfully submitted.'
            })
        })
    } else {
        res.json({
            status: 'fail',
            text: 'Authentication required!'
        })
    }
})

//get all requests
app.get('/all/requests', async (req, res) => {
    let r = await db.collection('requests')
        .orderBy('time', 'desc')
        .get();
    if (r.empty) {
        res.json({
            status: 'fail',
            text: 'Error to get requests'
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

app.get('/request/:id', async (req, res) => {
    let { id } = req.params;
    if (id) {
        let re = await db.collection('requests').doc(id).get();
        if (re.exists) {
            let da = re.data();
            res.json({
                status: 'success',
                data: da
            })
        } else {
            res.json({
                status: 'fail',
                text: 'No request with this user ID!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'User ID required!'
        })
    }
})

//approve shop
app.post('/approve/shop', async (req, res) => {
    let data = req.body;
    let g = await db.collection('requests').doc(data.ownerid).get();
    if (g.exists) {
        let reqdata = g.data()
        if (reqdata.owneremail === data.owneremail && reqdata.ownerid === data.ownerid) {
            await db.collection('requests').doc(data.ownerid).update({
                status: 'approved'
            }).then(async () => {
                await db.collection('shop').doc(reqdata.ownerid).set({
                    ownername: reqdata.ownername,
                    email: reqdata.owneremail,
                    ownerid: reqdata.ownerid,
                    ownerimg: reqdata.ownerimg,
                    shopname: reqdata.shopname,
                    shoptype: reqdata.shoptype,
                    shopdes: reqdata.shopdes,
                    status: 'active',
                    contact: {
                        phone: '09*****'
                    },
                    city: reqdata.city,
                    verify: 'Passed',
                    shopid: reqdata.ownerid,
                    logo: 'https://img.freepik.com/free-vector/shop-with-sign-we-are-open_23-2148547718.jpg?semt=ais_hybrid&w=740',
                    background: 'https://img.freepik.com/free-vector/hand-drawn-w-colours-illustration_23-2149834200.jpg?semt=ais_hybrid&w=740'
                }).then(() => {
                    res.json({
                        status: 'success',
                        text: 'Shop request was approved.'
                    })
                })
            })
        } else {
            res.json({
                status: 'fail',
                text: 'No permission to approve!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Error to approve shop requests'
        })
    }
})

//decline shop
app.post('/decline/shop', async (req, res) => {
    let data = req.body;
    let g = await db.collection('requests').doc(data.ownerid).get();
    if (g.exists) {
        let reqdata = g.data()
        if (reqdata.owneremail === data.owneremail && reqdata.ownerid === data.ownerid) {
            await db.collection('requests').doc(data.ownerid).update({
                status: 'declined'
            }).then(async () => {
                res.json({
                    status: 'success',
                    text: 'Shop request was declined.'
                })
            })
        } else {
            res.json({
                status: 'fail',
                text: 'No permission to approve!'
            })
        }
    } else {
        res.json({
            status: 'fail',
            text: 'Error to approve shop requests'
        })
    }
})

app.listen(80, () => {
    console.log('server started with port 80');
})