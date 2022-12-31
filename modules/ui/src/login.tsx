import React from 'react'
import { login } from 'modules/api'

function State() {
  return function (target: any) {
    return target
  }
}

@State()
class LoginForm {
  username = ''
  password = ''
}

function Form({ children, state, onSubmit }) {
  return <>{children}</>
}

export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <Form
        state={LoginForm}
        onSubmit={(state) => {
          login(state)
        }}
      >
        <input type="text" name="username" />
        <input type="password" name="password" />
        <button type="submit">Login</button>
      </Form>
    </div>
  )
}
