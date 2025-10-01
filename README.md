# 🧠 Quiz Web Application

A modern, interactive quiz web application built with HTML, CSS, and JavaScript. Test your knowledge across multiple categories with a sleek, responsive design.

## ✨ Features

- 🎯 **Multiple Quiz Categories**: General Knowledge, Science, History, Sports, and more
- 🎨 **Modern UI/UX**: Clean, responsive design with smooth animations
- 🌙 **Dark/Light Theme**: Toggle between themes for comfortable viewing
- ⏱️ **Timer System**: Timed quizzes to add excitement
- 📊 **Score Tracking**: Real-time score calculation and results display
- 📱 **Mobile Responsive**: Works perfectly on all device sizes
- 🔄 **Dynamic Questions**: JSON-based question system for easy updates

## 🚀 Demo

![Quiz Application Screenshot](https://via.placeholder.com/800x400/4CAF50/FFFFFF?text=Quiz+Web+Application)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Python 3.6+** installed on your system
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nishanthini84/Quiz_IBM.git
   cd Quiz_IBM
   ```

2. **Navigate to the project directory**
   ```bash
   cd Quiz_Web
   ```

## 🎮 How to Run

### Method 1: Using the Custom Server Script (Recommended)
```bash
python run_quiz_app.py
```
- Automatically opens your browser to `http://localhost:8001`
- Includes cache-busting headers for development

### Method 2: Using Python's Built-in Server
```bash
python -m http.server 8001
```
- Then open your browser and go to `http://localhost:8001`

### Method 3: Using the Batch File (Windows)
```bash
./start_quiz_app.bat
```

## 📁 Project Structure

```
Quiz_Web/
├── index.html          # Main landing page with login
├── quiz.html          # Quiz interface
├── result.html        # Results and score display
├── questions.json     # Quiz questions database
├── script.js          # JavaScript functionality
├── style.css         # CSS styling
├── run_quiz_app.py   # Custom Python server
├── start_quiz_app.bat # Windows batch file
└── README.md         # Project documentation
```

## 🎯 How to Play

1. **Start the Application**: Run the server using one of the methods above
2. **Enter Your Name**: Fill in your name on the login screen
3. **Select Category**: Choose from available quiz categories
4. **Answer Questions**: Select your answers within the time limit
5. **View Results**: See your score and review correct answers

## 🔧 Customization

### Adding New Questions

Edit the `questions.json` file to add new questions:

```json
{
  "category": "Your Category",
  "question": "Your question here?",
  "options": [
    "Option 1",
    "Option 2", 
    "Option 3",
    "Option 4"
  ],
  "correct": 0,
  "difficulty": "medium"
}
```

### Changing Themes

The application supports theme customization through CSS variables in `style.css`:

```css
:root {
  --primary-color: #4CAF50;
  --secondary-color: #45a049;
  --background-color: #f4f4f4;
  --text-color: #333;
}
```

## 🌐 Browser Compatibility

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## 📊 Features Overview

| Feature | Description |
|---------|-------------|
| 🎯 Multiple Categories | Science, History, Sports, General Knowledge |
| ⏰ Timer System | Configurable time limits per question |
| 📱 Responsive Design | Works on desktop, tablet, and mobile |
| 🎨 Theme Toggle | Dark and light mode support |
| 📊 Score Tracking | Real-time scoring with detailed results |
| 💾 Local Storage | Saves user preferences and progress |

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Author

**Nishanthini** - [GitHub Profile](https://github.com/Nishanthini84)

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this project
- Inspired by modern quiz applications and educational tools
- Built with ❤️ for learning and fun

## 📞 Support

If you have any questions or need help:
- Create an issue on GitHub
- Check the existing documentation
- Review the code comments for implementation details

---

**⭐ If you found this project helpful, please give it a star!**
