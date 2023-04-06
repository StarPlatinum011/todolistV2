const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();

//setting ejs
app.set('view engine', 'ejs');

//bodyparser initialization
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//db connection
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

//create schema
const todolistSchema = new mongoose.Schema({
  name:String
});

//create model
const TodoModel = mongoose.model('todo', todolistSchema);

//create an object
const todo1 = new TodoModel({
  name:'Welcome to your personal todolist.'
});
const todo2 = new TodoModel({
  name:'Hit the + item to add new list.'
});
const todo3 = new TodoModel({
  name:'Click checkbox to delete a todo.'
});

//add everything to the constant array
const defaultTodos = [todo1,todo2,todo3];


//schema for custom route list
const listSchema = new mongoose.Schema({
  name:String,
  items: [todolistSchema]
});
//model for list schema of dynamic routing 
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  TodoModel.find({},function(err, result){
    if(result.length===0){
      //add list to the database
      TodoModel.insertMany(defaultTodos, function(err){
        if(err){
          console.log('something went wrong!',err);
        }else{
          console.log('success...');
        }
      });
      //display the todo after adding in the list
      res.redirect('/');
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: result});
    };
  });


});

app.post("/", function(req, res){

  //store the data from html form
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //create a new document
  const newTodo = new TodoModel({
    name:itemName
  });

  if(listName==='Today'){
    newTodo.save();
    res.redirect('/');
  }else{
    List.findOne({name:listName}, function(err,foundList){
      if(err){
        console.log('found some errors: ',err);
      }else{
        // console.log(foundList+ "this is the found list in the array man... ");
        foundList.items.push(newTodo);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName==='Today') {

    TodoModel.findByIdAndDelete(checkedItemId, function(err){
      if(err){
        console.log('cant delete, something went wrong!')
      }else{
        console.log('item deleted.');
        res.redirect('/');
      }
    });
  } else {
    //delete and update the todo according to the distinct parameter names
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect('/'+ listName);
      }
    })
  }
});

//dynamic route parameters
app.get("/:customListName", function(req, res){
  //use lodash to capitalize the first letter
  const customListName = _.capitalize(req.params.customListName);

  //checking if the list is already existed
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //add to the list
        const list = new List({
          name:customListName,
          items: defaultTodos
        });

        list.save();

        //redirect to the custom parameters
        res.redirect("/"+customListName);
      }else{
        //dont add to the list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
  
  
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});