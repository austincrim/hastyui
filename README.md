# HastyUI 🏍️

a tiny DSL for React and TailwindCSS inspired by SwiftUI

> This project is mostly for fun and learning. Relax! Not intended for real world use.

Write something like:

```swift
VStack {
  Text("Hello World!")
  Text("Another line!")
}
```

and get this:

```jsx
export default function Component() {
  return (
    <div className="flex flex-col items-center">
      <p>Hello World!</p>
      <p>Another line!</p>
    </div>
  )
}
```
