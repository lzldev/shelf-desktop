import {TagColorFields as TagColor} from '../db/models/TagColor'

// export const defaultColors = [
//         {color:'#ef4444',name:''},
//         {color:'#f97316',name:''},
//         {color:'#22c55e',name:''},
//         {color:'#10b981',name:''},
//         {color:'#14b8a6',name:''},
//         {color:'#06b6d4',name:''},
//         {color:'#8b5cf6',name:''},
//         {color:'#a855f7',name:''},
//         {color:'#ec4899',name:''},
//         {color:'#f43f5e',name:''},
// ] satisfies TagColor[]

export const defaultColors = [
  {color: '#ef4444', name: 'Red'},
  {color: '#f97316', name: 'Orange'},
  {color: '#22c55e', name: 'Green'},
  {color: '#06b6d4', name: 'Cyan'},
  {color: '#8b5cf6', name: 'Purple'},
  {color: '#202020', name: 'Black'},
  {color: '#A8C0F8', name: 'Light Blue'},
] satisfies TagColor[]
