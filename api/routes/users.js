const express = require('express');
const User = require('../../models/User');
const validateRegisterInput = require('../../validation/register');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const validateLoginInput = require('../../validation/login');
const checkAuth = require('../../middleware/check-auth');

require('dotenv').config();

const userRouter = express.Router();

// @route GET /api/users/test
// @desc Test user route
// @ access private
userRouter.post('/test', (req, res, next) => {
  console.log(mongoose.Types.ObjectId.fromString(req.body.id));
  console.log(mongoose.Types.ObjectId.isValid(req.body.id));
  res.status(200).json({ message: 'Working' });
});

// @route POST /api/user/register
// @desc register the user
// @ access Public
userRouter.post('/register', (req, res, next) => {
  console.log("CHECKING IN BACKEND",req.body )
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { email, password, name } = req.body;

  User.findOne({ email })
    .exec()
    .then(user => {
      if (user) {
        res
          .status(409)
          .json({ message: 'User with this email already exists' });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        bcrypt.hash(password, 10).then(hash => {
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.status(201).json(user))
            .catch(error => res.status(500).json(error));
        });
      }
    })
    .catch(err => res.status(500).json(err));
});

// @route POST /api/user/login
// @desc login the user
// @ access Public

userRouter.post('/login', async (req, res, next) => {
  try {
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(401).json({ message: 'Auth Failed' });
    }
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      const token = jwt.sign(
        {
          email: user.email,
          userId: user._id,
        },
        'abcdefghijklmno',
        {
          expiresIn: '10h',
        }
      );
      return res.status(200).json({ message: 'Auth Successful', token });
    }
    res.status(401).json({ message: 'Auth Failed' });
  } catch (e) {
    throw new Error(e.message);
  }
});

userRouter.patch('/update/:id', (req, res, next) => {
  console.log("HI for update roue")
  
  const body = {}
  if (req.body.password.length > 6){
    const hashPassword = bcrypt.hash(req.body.password, 10)
    body.password = hashPassword
  }
  if (body.password &&  body.password.length < 6){
    return res.status(401).json({ message: 'Password length Failed' });
  }
  if (req.body.email.length > 6){
    body.email = email
  }
  if (body.email &&  body.email.length < 6){
    return res.status(401).json({ message: 'Email not suitable' });
  }
  console.log("NOW BEFORE UPDATE BODY", body)
  User.findByIdAndUpdate({ _id: req.params.id }, body)
  .exec()
  .then(() => res.status(200).json({ message: 'User Updated' }))
  .catch(err => res.status(500).json(err));
} )

// @route DELETE /api/user/:userId
// @desc delete the user with provided user Id
// @ access private TODO make it private
userRouter.delete('/:userId', (req, res, next) => {
  User.findOneAndDelete({ _id: req.params.userId })
    .exec()
    .then(() => res.status(200).json({ message: 'User deleted' }))
    .catch(err => res.status(500).json(err));
});

userRouter.get('/current', checkAuth, (req, res, next) => {
  return res.status(200).json(req.userData);
});

module.exports = userRouter;
