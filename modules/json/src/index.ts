import { makeFilterParsers } from 'modules/file-parse'
import { parse, stringify } from 'comment-json'

export const {
  read: readJson,
  write: writeJson,
  edit: editJson,
} = makeFilterParsers({
  read: (fileContents: string) => {
    return parse(fileContents)
  },
  write: (obj: any) => stringify(obj, null, 2),
})
