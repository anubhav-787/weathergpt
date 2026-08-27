import React from 'react'

const ContactPage = () => {
  return (
    <div className=' bg-fuchsia-200 flex overflow-x-auto'>
      <div className='h-[100vh] w-1/2 text-5xl font-bold flex flex-col justify-center align-center ml-3.5 border-2 p-1.'><div className='text-center text-black'>Contact Us</div></div>
      <div className='h-[100vh] w-1/2 flex flex-col justify-center align-center p-5 '>
        <p className='text-gray-700'>We are available for questions, feedback, or collaboration opportunities. Let us know how we can help!</p>
        <p className='font-bold text-lg text-gray-700'>You can reach us at <span className='underline text-blue-600'>anubhavdixit688@gmail.com</span></p>
        <p className='font-bold text-lg text-gray-700'>You can reach us at <span className='underline text-blue-600'>anshrai098765@gmail.com</span></p>

        <div className="font-bold text-lg text-gray-700">
          <p>Team Member Name : <span className="underline text-blue-600">Anubhav Dixit</span></p>
          <p>Team Member Name : <span className="underline text-blue-600">Anushka Dixit</span></p>
          <p>Team Member Name : <span className="underline text-blue-600">Ansh Rai</span></p>
          <p>Team Member Name : <span className="underline text-blue-600">Awani Dubey</span></p>
          <p>Team Member Name : <span className="underline text-blue-600">Deepanshu Tiwari</span></p>
          <p>Team Member Name : <span className="underline text-blue-600">Devesh Pathak</span></p>
        </div>
      </div>
    </div>
  )
}

export default ContactPage