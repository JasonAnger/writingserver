const express = require('express')
const app = express()
const multipart = require('connect-multiparty')
const fs = require('fs')
const bodyParser = require('body-parser')
const multer = require('multer')
const mongoose = require('mongoose')
const cors = require('cors')
const md5 = require('md5')
const session = require('express-session');
const cookieParser = require('cookie-parser')
const http = require('http')
const https = require('https')
const path = require('path')

const Post = require('./models/Post.model')

const auth = (req, res, next) => {
    try {
        const token = req.cookies.token
        if(token==md5("thanhnguyen"+"123123")) {
            next()
        } else {
            res.redirect('/login')
        }
    } catch(e) {
        res.redirect('/login')
    }
}

require('dotenv').config()
mongoose.connect(process.env.MONGO, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log("Mongo Connection is success.")
}).catch(error => handleError(error));
const multipartMiddleware = multipart()
const PORT = process.env.PORT || 3000

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/posts')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now()
      cb(null, uniqueSuffix + '-' + file.originalname)
    }
  })
const upload = multer({ storage: storage })

app.set("view engine", "ejs")
app.set("views", "./views")

app.use(cookieParser())
app.use(cors())
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static("./public"))
app.use(session({
    secret: "secret",
	resave: true,
    saveUninitialized: true,
    cookie: {}
}))

app.get("/", auth , (req, res) => {
    res.render("index")
})
app.get("/login", (req, res) => {
    res.render("login")
})
app.post("/login", (req, res) => {
    if(req.body.username=="thanhnguyen" && req.body.password=="123123") {
        let options = {
            maxAge: 1000 * 60 * 60 * 24 * 7, // would expire after 15 minutes
        }
        res.cookie('token', md5(req.body.username+req.body.password), options)
        res.redirect("/")
    }
})
app.post("/logout", (req, res) => {
    res.clearCookie("token")
    res.redirect("/login")
})
app.get("/posts", auth , async (req, res) => {
    const posts = await Post.find()
    res.render("posts", {posts: posts})
})
app.get("/vietbai", auth , (req, res) => {
    res.render("vietbai")
})
app.get("/edit/:id", auth , async (req, res) => {
    const editPost = await Post.findOne({_id: req.params.id})
    res.render("suabai", {post: editPost})
})
app.get("/thanhcong", auth , (req, res) => {
    res.render("thanhcong")
})
app.get("/thatbai", auth , (req, res) => {
    res.render("thatbai")
})
app.post("/upload", multipartMiddleware, (req, res) => {
    try {
        fs.readFile(req.files.upload.path, function (err, data) {
            var newPath = __dirname + '/public/images/' + req.files.upload.name;
            fs.writeFile(newPath, data, function (err) {
                if (err) console.log({err: err});
                else {
                    console.log(req.files.upload.originalFilename);
                //     imgl = '/images/req.files.upload.originalFilename';
                //     let img = "<script>window.parent.CKEDITOR.tools.callFunction('','"+imgl+"','ok');</script>";
                //    res.status(201).send(img);
                 
                    let fileName = req.files.upload.name;
                    let url = '/images/'+fileName;                    
                    let msg = 'Upload successfully';
                    let funcNum = req.query.CKEditorFuncNum;
                    console.log({url,msg,funcNum});
                   
                    res.status(201).send("<script>window.parent.CKEDITOR.tools.callFunction('"+funcNum+"','"+url+"','"+msg+"');</script>");
                }
            });
        });
       } catch (error) {
           console.log(error.message);
       }
})
app.get("/api/:id", async (req, res) => {
    Post.findOne({_id:req.params.id}).then(post => {
        res.json(post)
    })
})
app.post("/api/edit/:id", upload.single('thumbnail'), (req,res) => {
    req.body.tags= req.body.tags.trim().split(" ")
    if(req.file) {
        req.body.thumbnail = replaceAllBackslash(req.file.path.replace("public",""))
    }
    Post.findByIdAndUpdate({_id: req.params.id}, req.body).then(() => {
        res.render("thanhcong")
    }).catch((err) => {
        console.log(err)
        res.render("thatbai")
    })                
})
app.post("/api/create", upload.single('thumbnail'), (req,res) => {
    req.body._id= new mongoose.Types.ObjectId
    req.body.tags= req.body.tags.trim().split(" ")
    if(req.file) {
        req.body.thumbnail = replaceAllBackslash(req.file.path.replace("public",""))
    }
    const post = new Post(req.body)
    post.save().then(() => {
        res.render("thanhcong")
    }).catch((err) => {
        console.log(err)
        res.render("thatbai")
    })                
})
app.delete("/api/delete/:id", upload.single('thumbnail'), (req,res) => {
    Post.findOneAndDelete({_id: req.params.id}).then(() => {
        res.json({status: "Thành công"})
    }).catch((err) => {
        console.log(err)
        res.json({status: "Thất bại"})
    })                
})

// app.listen(PORT, () => {
//     console.log("Server is running on port "+PORT)
// })


const httpServer = http.createServer((req, res) => {
    res.statusCode = 301;
    res.setHeader('Location', `https://${hostname}${req.url}`);
    res.end(); // make sure to call send() or end() to send the response
 });
httpServer.listen(80, () => console.log(`Server is running on Port ${80}.`))

const sslServer = https.createServer(
    {
        // key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')), 
        // ca: fs.readFileSync(path.join(__dirname, 'cert', 'tridancoin_com.ca-bundle')),
        // cert: fs.readFileSync(path.join(__dirname, 'cert', 'tridancoin_com.crt'))
    }, app
)

sslServer.listen(443, () => console.log(`Secure Server is running on Port ${443}.`))

function replaceAllBackslash(item) {
    while(item.indexOf("\\")>=0) {
        item=item.replace("\\","/")
    }
    return item
}
