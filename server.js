const express = require('express')
const app = express()
const multipart = require('connect-multiparty')
const fs = require('fs')
const bodyParser = require('body-parser')
const multer = require('multer')
const mongoose = require('mongoose')
const cors = require('cors')
 
const Post = require('./models/Post.model')

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

app.use(cors())
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static("./public"))

app.get("/", (req, res) => {
    res.render("index")
})
app.get("/posts", async (req, res) => {
    const posts = await Post.find()
    res.render("posts", {posts: posts})
})
app.get("/vietbai", (req, res) => {
    res.render("vietbai")
})
app.get("/edit/:id", async (req, res) => {
    const editPost = await Post.findOne({_id: req.params.id})
    res.render("suabai", {post: editPost})
})
app.get("/thanhcong", (req, res) => {
    res.render("thanhcong")
})
app.get("/thatbai", (req, res) => {
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

app.listen(PORT, () => {
    console.log("Server is running on port "+PORT)
})

function replaceAllBackslash(item) {
    while(item.indexOf("\\")>=0) {
        item=item.replace("\\","/")
    }
    return item
}