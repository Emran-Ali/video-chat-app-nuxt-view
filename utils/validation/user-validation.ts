import * as yup from 'yup'

export const signUpValidation = yup.object({
  password: yup
    .string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters.')
    .max(32, 'Password must be no more than 32 characters.'),
  email: yup
    .string()
    .required('Email is required.')
    .email('Invalid email address.')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address.'),
  name: yup
    .string()
    .required('Name is required.')
    .min(3, 'Name must be at least 3 characters.')
    .max(32, 'Name must be no more than 32 characters.'),
  image: yup.string().url('Invalid URL').required('Image is required.'),
})
export const loginValidation = yup.object({
  password: yup
    .string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters.')
    .max(32, 'Password must be no more than 32 characters.'),
  email: yup
    .string()
    .required('Email is required.')
    .email('Invalid email address.')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address.'),
})
