"use server"

import nodemailer  from "nodemailer";

export async function contactForm(formData: FormData) {
    console.log(process.env)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const message = formData.get("message") as string

     const transporter = nodemailer .createTransport({
                host: process.env.NODEMAILER_HOST,
                port: Number(process.env.NODEMAILER_PORT),
                secure: true,
                auth: {
                    user: process.env.NODEMAILER_USER,
                    pass: process.env.NODEMAILER_PASS,
                },
            }) 
             await transporter.sendMail({
          from: `"Contact Form" <${process.env.NODEMAILER_USER}>`,
          to: "developpement@raonletape.fr",
          replyTo: email,
          subject: `Contact form from ${name}`,
          text: `
    Nom: ${name}
    Email: ${email}
    
    Message:
    ${message}
          `,
        })
}