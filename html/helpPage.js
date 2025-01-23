// SpaceDAO Database API Help Page
// Author: Robert Cowlishaw (0x365)
// Info: 
// - Creates html for database API help page

const generateHelpPage = (eventNames, addressList, addressToFilePathMap) => {
    // Generate the list of event endpoints with buttons
    const eventListHtml = eventNames.map(eventName => {
      const endpoint = `/event/${eventName}`;
      return `
        <div class="endpoint-item">
          <span class="endpoint-text">${endpoint} : get all events named ${eventName}</span>
          <button onclick="window.location.href='${endpoint}'" class="endpoint-button">Go there</button>
        </div>
      `;
    }).join('');

    const addressListHtml = addressList.map(address => {
        const endpoint = `/address/${address}`;
        return `
          <div class="endpoint-item">
            <span class="endpoint-text">${endpoint} : get all contract's events</span>
            <button onclick="window.location.href='${endpoint}'" class="endpoint-button">Go there</button>
          </div>
        `;
    }).join('');

    const nameListHtml = addressList.map(address => {
        const endpoint = `/name/${addressToFilePathMap[address]}`;
        return `
          <div class="endpoint-item">
            <span class="endpoint-text">${endpoint} : get all contract's events</span>
            <button onclick="window.location.href='${endpoint}'" class="endpoint-button">Go there</button>
          </div>
        `;
    }).join('');
  
    // Complete HTML page
    return `
      <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Help Page</title>
            <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f4f6fc;
                color: #333;
            }

            h1 {
                color: #2c3e50;
                font-size: 2.5rem;
                margin-bottom: 20px;
            }

            h2 {
                color: #34495e;
                font-size: 1.8rem;
                margin-top: 30px;
            }

            p {
                font-size: 1.1rem;
                line-height: 1.6;
                color: #555;
            }

            .endpoint-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 15px 0;
                padding: 10px;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: background-color 0.3s, transform 0.3s;
            }

            .endpoint-item:hover {
                background-color: #ecf0f1;
                transform: translateY(-3px);
            }

            .endpoint-text {
                font-weight: bold;
                font-size: 1.1rem;
                color: #333;
            }

            .endpoint-button {
                padding: 8px 12px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                transition: background-color 0.3s, transform 0.3s;
            }

            .endpoint-button:hover {
                background-color: #0056b3;
                transform: translateY(-3px);
            }

            footer {
                margin-top: 40px;
                text-align: center;
                color: #aaa;
                font-size: 0.9rem;
                padding: 20px;
                background-color: #ffffff;
                color: #fff;
                position: relative;
                bottom: 0;
                width: 100%;
                border-radius: 8px;
            }

            footer p {
                margin: 0;
            }
            </style>
        </head>
        <body>
            <h1>SpaceDAO API Help Documentation</h1>
            <p>Welcome to the SpaceDAO API documentation! Below is a list of available endpoints for each event type. Other than this help page, all other endpoints will return JSON data.</p>
            <h2>File Structure</h2>
            <div class="endpoint-item">
                <span class="endpoint-text">/help : The page you are on now</span>
                <button onclick="window.location.href='/help'" class="endpoint-button">Go there</button>
            </div>
            <div class="endpoint-item">
                <span class="endpoint-text">/all : Get all events in database</span>
                <button onclick="window.location.href='/all'" class="endpoint-button">Go there</button>
            </div>
            <h2>Sort by Event Name</h2>
            <div>
              ${eventListHtml}
            </div>
            <h2>Sort by Contract Address</h2>
            <div>
              ${addressListHtml}
            </div>
            <h2>Sort by Contract Name (file name in targets)</h2>
            <div>
              ${nameListHtml}
            </div>

            <footer>
            <p>API Documentation - Version 1.0</p>
            </footer>
        </body>
       </html>
    `;
};

module.exports = generateHelpPage;
