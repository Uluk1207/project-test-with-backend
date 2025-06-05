import express from 'express'
const app = express()
import bodyParser from 'body-parser'
import { Sequelize, Model, DataTypes } from 'sequelize'

const port = 3000

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});


// Define User model
class Tests extends Model {}
Tests.init({
  tests: {
    type: DataTypes.STRING,
    defaultValue: 'tests'  // <-- задаём значение по умолчанию
  },
  data: DataTypes.TEXT
}, {
  sequelize,
  modelName: 'tests'
});

class Users extends Model {}
Users.init({
  users: {
    type: DataTypes.STRING,
    defaultValue: 'users'  // <-- задаём значение по умолчанию
  },
  data: DataTypes.TEXT,
}, {
  sequelize,
  modelName: 'users'
});

// Sync models with database
sequelize.sync();

// Middleware for parsing request body

app.use(express.json());
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



// CRUD routes for User model
app.get('/users', async (req, res) => {
  const users = await Users.findAll();
  res.json(users);
});

app.post('/users', async (req, res) => {
  console.log(typeof req.body, 'here');

  try {
    // Ищем пользователя, где users = 'users'
    const existingUser = await Users.findOne({ where: { users: 'users' } });

    if (existingUser) {
      // Обновляем только поле data
      await existingUser.update({ data: JSON.stringify(req.body) });
      return res.json({ message: `Пользователь с users="users" обновлён`, status: 200 });
    } else {
      // При создании можно взять всё тело, если оно корректное
      const newUser = await Users.create({
        users: 'users',
        data: JSON.stringify(req.body)
      });
      return res.json({ message: `Success! User created with id: ${newUser.id}`, status: 200 });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
});


app.get('/tests', async (req, res) => {
  const tests = await Tests.findAll();
  res.json(tests);
});

app.post('/tests', async (req, res) => {
  console.log(typeof req.body, 'here');

  try {
    // Ищем пользователя, где users = 'users'
    const existingUser = await Tests.findOne({ where: { tests: 'tests' } });

    if (existingUser) {
      // Обновляем только поле data
      await existingUser.update({ data: JSON.stringify(req.body) });
      return res.json({ message: `Test с tests="tests" обновлён`, status: 200 });
    } else {
      // При создании можно взять всё тело, если оно корректное
      const newUser = await Tests.create({
        tests: 'tests',
        data: JSON.stringify(req.body)
      });
      return res.json({ message: `Success! Tests created with id: ${newUser.id}`, status: 200 });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера', error });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
