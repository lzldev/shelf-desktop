import { InsertObject, Kysely } from "kysely"
import { Prettify } from "../../types/utils"
import { DB } from "./kysely-types"

type DBInstance = Kysely<DB>
type PathsCreateValues = InsertObject<DB, 'Paths'>

function CreateManyPaths(
  connection: DBInstance,
  values: PathsCreateValues[],
) {
  return connection.insertInto('Paths').values(values).execute()
}



export {CreateManyPaths}
