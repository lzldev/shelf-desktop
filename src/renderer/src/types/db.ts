import {InferAttributes, InferCreationAttributes} from 'sequelize'
import {
  Content as ContentModel,
  Tag as TagModel,
  ContentTag as ContentTagModel,
  TagColor as TagColorModel,
  Path as PathModel,
} from 'src/main/src/db/models'

/* 
    Re-Exporting Types without Functions
*/
export type Content = InferAttributes<ContentModel>
export type ContentCreation = InferCreationAttributes<ContentModel>

export type Tag = InferAttributes<TagModel>
export type TagCreation = InferCreationAttributes<TagModel>

export type ContentTag = InferAttributes<ContentTagModel>
export type ContentTagCreation = InferCreationAttributes<ContentTagModel>

export type TagColor = InferAttributes<TagColorModel>
export type TagColorCreation = InferCreationAttributes<TagColorModel>

export type Path = InferAttributes<PathModel>
export type PathCreation = InferCreationAttributes<PathModel>
