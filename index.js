require('dotenv').config()
const express = require('express')
const morgan = require('morgan');
const cors = require('cors')
const app = express()

const Person = require('./models/person')

const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(express.json())
morgan.token('body', function (req, res) { return JSON.stringify(req.body) })
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));
app.use(express.static('dist'))

app.get('/info', (req, res) => {
  const currentTime = new Date()
  Person.countDocuments({}).then(personsCount => 
    res.send(`<div>
            <p>Phonebook has info for ${personsCount} people</p>
            <p>${currentTime.toString()}</p>
            </div>`)
  )
})

app.get('/api/persons', (req, res) => {
  Person.find({}).then(Persons => {
    res.json(Persons)
  })
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
  .then(person => {
    if (person) {
      res.json(person)
    } else {
      res.status(404).end()
    }
  })
  .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body

  if (!body.name || !body.number) {
    return res.status(400).json({ 
      error: 'content missing' 
    })
  }

  const person =  new Person({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    res.json(savedPerson)
  })
  .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndDelete(req.params.id)
  .then(result => {
    res.status(204).end()
  })
  .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(
    req.params.id, 
    person, 
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      res.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})