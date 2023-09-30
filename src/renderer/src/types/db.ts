//@ts-ignore Outside this tsconfig Scope
import * as DB from '../../../main/db/models'
import {InferAttributes, InferCreationAttributes} from 'sequelize'

/*
    Re-Exporting Types without Functions
*/

export type Content = InferAttributes<DB.Content>
export type ContentCreation = InferCreationAttributes<DB.Content>

export type Tag = InferAttributes<DB.Tag>
export type TagCreation = InferCreationAttributes<DB.Tag>

export type ContentTag = InferAttributes<DB.ContentTag>
export type ContentTagCreation = InferCreationAttributes<DB.ContentTag>

export type TagColor = InferAttributes<DB.TagColor>
export type TagColorCreation = InferCreationAttributes<DB.TagColor>

export type Path = InferAttributes<DB.Path>
export type PathCreation = InferCreationAttributes<DB.Path>
