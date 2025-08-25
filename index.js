// index.js
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const { ObjectId, MongoClient } = require('mongodb');

// MongoDB 연결 문자열
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, { useUnifiedTopology: true });
const dbName = "local";
const collectionName = "todolist"

app.set('PORT', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 홈페이지
app.get('/home', (req, res) => {
  // res.end("<h1>Hello world</h1>");
  req.app.render('home', {}, (err, html) => {
    if (err) throw err;
    res.end(html);
  });
});

// 최초 데이터 입력하기
app.get('/todos', (req, res) => {
  // test ...
  // res.end("<h1>Hello world</h1>");
  let todoList = [
    {
      _id: ObjectId('689d8ca73fcaefd98ceec4af'),
      title: '밥먹기2',
      done: false
    },
    {
      _id: ObjectId('689d8ca73fcaefd98ceec4b0'),
      title: '잠자기2',
      done: false
    },
    {
      _id: ObjectId('689d8ca73fcaefd98ceec4b1'),
      title: '공부하기2',
      done: true
    },
    {
      _id: ObjectId('689d8ca73fcaefd98ceec4b2'),
      title: '친구랑 놀기2',
      done: false
    }
  ];
  req.app.render('todolist', { todoList }, (err, html) => {
    if (err) throw err;
    res.end(html);
  });
});

// 입력페이지 호출
app.get("/todo/input", (req, res) => {


  res.render("todoInput", {});
});

// 리스트 불러오기
app.get("/todo/list", async (req, res) => {
  // 몽고디비에서 데이터 가져오기
  try {

    const database = client.db(dbName);
    const todoCollection = database.collection(collectionName);
    const QUERY = {};
    const cursor = todoCollection.find(QUERY, {});
    if ((await todoCollection.countDocuments(QUERY)) === 0) {
      console.log("No documents found!");
    }
    const todoList = [];
    for await (const doc of cursor) {
      todoList.push(doc);
    }
    req.app.render("todolist", { todoList }, (err, html) => {
      if (err) throw err;
      res.end(html);
    });
  }
  finally {
    // await client.close();
  }
});

// 상세보기
app.get("/todo/detail", async (req, res) => {
  // const todo = {
  //     _id: "66cd366077f73fe18a9bedee",
  //     title: '공부하기2',
  //     done: false
  // };
  console.log(req.query._id);
  try {
    // await client.connect();
    const database = client.db(dbName);
    const todoCollection = database.collection(collectionName);
    const QUERY = { _id: new ObjectId(req.query._id) };
    const findedTodo = await todoCollection.findOne(QUERY, {});
    console.log(findedTodo);
    req.app.render("todoDetail", { todo: findedTodo }, (err, html) => {
      if (err) throw err;
      res.end(html);
    });
  } finally {
    // await client.close();
  }
});


// 수정하기 불러오기
app.get("/todo/modify", async (req, res) => {
  // const todo = {
  //     _id: "66cd366077f73fe18a9bedee",
  //     title: '공부하기2',
  //     done: false
  // };
  console.log(req.query._id);
  try {
    // await client.connect();
    const database = client.db(dbName);
    const todoCollection = database.collection(collectionName);
    const QUERY = { _id: new ObjectId(req.query._id) };
    const findedTodo = await todoCollection.findOne(QUERY, {});
    console.log(findedTodo);


    req.app.render("todoModify", { todo: findedTodo }, (err, html) => {
      if (err) throw err;
      res.end(html);
    });
  }
  finally {
    //await client.close();
  }
});


// 수정내용 입력하기
app.post("/todo/modify", async (req, res) => {
  console.log(req.body._id);
  try {
    // await client.connect();
    const database = client.db(dbName);
    const movies = database.collection(collectionName);
    const filter = { _id: new ObjectId(req.body._id) };
    const options = { upsert: true };
    const updateDoc = {
      $set: {
        title: req.body.title,
        done: (req.body.done == "true" ? true : false)
      }
    };// Update the first document that matches the filter
    const result = await movies.updateOne(filter, updateDoc, options);
    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,);

    res.redirect("/todo/list");
  }
  finally {
    // await client.close();
  }

});


// 삭제하기
app.get("/todo/delete", async (req, res) => {
  try {
    await client.connect();
    const database = client.db(dbName);
    const todos = database.collection(collectionName);
    const query = { _id: new ObjectId(req.query._id) };
    const result = await todos.deleteOne(query);
    if (result.deletedCount === 1) {
      console.log("Successfully deleted one document.");
    } else {
      console.log("No documents matched the query. Deleted 0 documents.");
    }
    res.redirect("/todo/list");
  }
  finally {
    // Close the connection after the operation completes
    // await client.close();
  }

});

// 입력 하기
app.post("/todo/input", async (req, res) => {
  try {
    const database = client.db(dbName);
    const todoCollection = database.collection(collectionName);

    const newTodo = {
      title: req.body.title,        // 입력한 제목
      done: false,                  // 처음엔 기본값 false
      createdAt: new Date()         // 등록 시간 (추가)
    };

    const result = await todoCollection.insertOne(newTodo);
    console.log(`새로운 TODO 추가됨: ${result.insertedId}`);

    // 입력 후 목록으로 이동
    res.redirect("/todo/list");
  } catch (err) {
    console.error("할 일 추가 중 오류:", err);
    res.status(500).send("할 일 추가 실패");
  }
});


// 서버 실행
const server = http.createServer(app);
server.listen(app.get('PORT'), () => {
  console.log(`Run on server: http://localhost:${app.get('PORT')}`);

  // 프로세스 실행 시 1회
  client.connect();
});
