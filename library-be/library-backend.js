const { ApolloServer, gql, UserInputError, AuthenticationError } = require('apollo-server')
require('dotenv').config()

const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

const MONGODB_URI = process.env.MONGODB_URI
const JWT_KEY = process.env.JWT_KEY

const jwt = require('jsonwebtoken')


mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]
    allAuthors: [Author!]
    me: User
  }

  type Book {
    title: String!
    published: Int!
    author: String!
    id: ID!
    genres: [String!]!
  }

  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
`

const resolvers = {
  Query: {
    bookCount: async () => await Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (!args.author && !args.genre) {
        return Book.find({})
      }

      if (args.author && args.genre) {
        const author = await Author.findOne({ name: args.author })
        const books = await Book.find({
          author,
          genres: { $in: [args.genre] },
        })
        return books
      }

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        const books = await Book.find({ author })
        return books
      }

      if (args.genre) {
        const books = await Book.find({
          genres: { $in: [args.genre] }
        })
      }

    },
    allAuthors: async (root, args) => {
      return Author.find({})
    },
    me: async (root, args, context) => {
      return context.currentUser
    },
  },
  Author: {
    name: (root, args) => root.name,
    born: (root, args) => root.born,
    id: (root, args) => root.id,
    bookCount: async (root, args) => {
      return await Book.find({ author: root._id }).countDocuments()
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('Not authenticated!')
      }

      if (args.author.length < 3 || args.title.length < 3) {
        throw new UserInputError('Names and titles must be at least 4 characters long.')
      }

      const existingAuthor = await Author.findOne({ name: args.author })

      let newAuthor = null

      if (!existingAuthor) {
        newAuthor = new Author({ name: args.author, born: null })
          try {
            await newAuthor.save()
          } catch (error) {
            throw new UserInputError(error.message, {
              invalidArgs: args
            })
          }     
      }

      const book = new Book({
        ...args,
        author: existingAuthor ? existingAuthor : newAuthor
      })

      try {
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
    },
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('Not authenticated!')
      }

      if (args.setBornTo < 0 || args.setBornTo > 2022) {
        throw new UserInputError('Give a valid year')
      }

      const updateAuthor = await Author.findOne({ name: args.name })

      if (!updateAuthor) {
        throw new UserInputError('The author does not exist!')
      }

      try {
        updateAuthor.born = args.setBornTo
        await updateAuthor.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args
        })
      }
    },
    createUser: async (root, args) => {
      const newUser = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      try {
        await newUser.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return newUser

    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'mogura') {
        throw new UserInputError('Wrong creds!')
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_KEY) }

    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_KEY)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})