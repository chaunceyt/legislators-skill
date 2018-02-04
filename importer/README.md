# Importing https://github.com/unitedstates/congress-legislators current legislators csv file.

This skill relies on a csv file download from the stated github address.

1. run: `wget https://theunitedstates.io/congress-legislators/legislators-current.csv`
2. run: npm install
3. run: npm run populate-db

Check you database to ensure you have records.

aws dynamodb scan --table-name legislators-contact-info-dev --return-consumed-capacity TOTAL

You should see something like `"ScannedCount": 538,`


