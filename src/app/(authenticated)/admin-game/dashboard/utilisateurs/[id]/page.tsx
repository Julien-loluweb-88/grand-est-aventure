import React from 'react'

const page = async ({params}: {params: {id: string}}) => {
    const {id} = await params
    console.log("je suis la page utilisateur", id)
  return (
    <div>page</div>
  )
}

export default page