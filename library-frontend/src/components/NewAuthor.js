import { useMutation, useQuery } from '@apollo/client'
import React, { useState } from 'react'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'

const NewAuthor = ({ show }) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [brth] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  })

  const results = useQuery(ALL_AUTHORS)
  const allAuthors = results.data?.allAuthors

  const onSubmit = (e) => {
    e.preventDefault()

    brth({ variables: { name, setBornTo: parseInt(born) } })
    setName('')
    setBorn('')
  }

  const onChangeName = ({ target }) => setName(target.value)
  const onChangeBorn = ({ target }) => setBorn(target.value)

  return (
    <>
      {!show && null}
      {show && (
        <div>
          <h2>Set birth year</h2>
          <form onSubmit={onSubmit}>
            <div>
              {results.loading && <div>Still loading!</div>}
              {!results.loading && 
                <select onChange={onChangeName} value={name}>
                  {allAuthors.map((author) => (
                    <option 
                      key={author.name}
                      value={author.name}>
                      {author.name}
                    </option>
                  ))}
                </select>
              }
            </div>
            <div>
              Year of birth:
              <input type={'number'} onChange={onChangeBorn} value={born} />
            </div>
            <button type='submit'>Update birth year</button>
          </form>
        </div>
      )}
    </>
  )
}

export default NewAuthor