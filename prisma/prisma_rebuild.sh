# /bin/bash

rm -vrf ./prisma/migrations/; # clears migrations folder if any
rm -v ./prisma/migration.sql; # clears migrations file

npx prisma migrate dev --create-only --name initial; # generate new sql file
mv -v $(find ./prisma/ -name 'migration.sql') ./prisma/; # move it to prisma root
rm -vrf ./prisma/migrations/; # removes the new migrations folder
