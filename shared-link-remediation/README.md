# Shared Link Remediation
A Node.js script that parses the Shared Link report generated in the Box Admin Console and updates or optionally removes the shared links that are open.

## Pre-Requisites
1. Ensure you've completed pre-requisites in the [parent project documentation](../README.md)
2. Copy the *_config.json file generated when creating the JWT application.
3. Install dependencies:
    * Change to the /server directory and run `yarn install` or `npm install`
    * Change to the /client directory and run `yarn install` or `npm install`
4. Adjust the following variables as needed:
    * [SHARED_LINK_REPORT_FILE_ID]()
    * [TEST_MODE]()
    * [REMOVE_SHARED_LINK]()
    * [SHARED_LINK_UPDATE_STRATEGY]()
    * [SHARED_LINK_NEW_EXP_DATE_DURATION_IN_DAYS]()
    * [SHARED_LINK_THRESHOLD_IN_DAYS]()
5. Run the NPM start script: `yarn start` or `npm start`


## Disclaimer
This project is a collection of open source examples and should not be treated as an officially supported product. Use at your own risk. If you encounter any problems, please log an [issue](https://github.com/kylefernandadams/box-node-automations/issues).

## License

The MIT License (MIT)

Copyright (c) 2021 Kyle Adams

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
