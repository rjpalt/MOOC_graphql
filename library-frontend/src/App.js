import { useState } from 'react'

import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import NewAuthor from './components/NewAuthor'

const App = () => {

  const [page, setPage] = useState('authors')

  return (
    <>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={() => setPage('edit')}>edit author</button>
      </div>

      <Authors show={page === 'authors'} />

      <Books show={page === 'books'} />

      <NewBook show={page === 'add'} />

      <NewAuthor show={page === 'edit'} />
    </>
  )
}

export default App
