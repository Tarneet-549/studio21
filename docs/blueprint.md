# **App Name**: MarketPilot

## Core Features:

- Real-time Data Display: Display real-time market data fetched from the WebSocket stream, including order book levels (asks and bids) for the selected cryptocurrency.
- User Input Parameters: Provide interactive input fields for users to specify the exchange (OKX), spot asset, order type (market), quantity, volatility, and fee tier.
- Slippage Prediction: Estimate the expected slippage using a linear regression model tool based on the current order book data. This module takes real-time L2 orderbook data as input and returns the projected slippage cost based on order size. 
- Market Impact Estimation: Use an Almgren-Chriss model to estimate the expected market impact of a trade. It quantifies how the order size affects the price, predicting temporary and permanent market impacts.
- Output Visualization: Visually present the calculated output parameters, including expected slippage, fees, market impact, net cost, maker/taker proportion, and internal latency. The presentation must update dynamically in response to changing inputs and market data.

## Style Guidelines:

- Primary color: A deep blue (#3F51B5) to convey trust, stability, and technical expertise, all essential in financial applications.
- Background color: A very light, desaturated blue-gray (#F5F6FA) provides a clean and unobtrusive backdrop, ensuring that data and interactive elements stand out.
- Accent color: A vibrant, contrasting orange (#FF9800) highlights key interactive elements like the 'Simulate Trade' button and important output values. This draws the user's attention to actionable items and critical results.
- Use clear and concise typography to ensure readability.
- Organize input parameters in a left panel and processed output values in a right panel for clear separation and easy user navigation.
- Incorporate minimalistic icons to represent different input parameters and output metrics for better visual understanding.