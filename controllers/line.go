package controllers

import (
	"dai-writer/auth"
	"dai-writer/llm"
	"dai-writer/models"

	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

type input struct {
	Input string `json:"input"`
}

func Line(c *gin.Context) {
	c.HTML(http.StatusOK, "line.tmpl", gin.H{
		"title":  "Line",
		"prefix": os.Getenv("URL_PREFIX"),
		"js":     "line.js",
	})
}

func ListLine(c *gin.Context) {
	var user auth.User

	u, ok := c.Get("current_user")
	if ok != true {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	book, err := strconv.Atoi(c.Param("book"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	scene, err := strconv.Atoi(c.Param("scene"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	user = u.(auth.User)
	line, ok := models.ListLine(&user, book, scene)
	if ok != true {
		c.JSON(http.StatusNotFound, gin.H{"message": "Line not found"})
		return
	}
	c.JSON(http.StatusOK, line)
}

func GetLine(c *gin.Context) {
	var user auth.User
	var id int

	u, ok := c.Get("current_user")
	if ok != true {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	book, err := strconv.Atoi(c.Param("book"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	scene, err := strconv.Atoi(c.Param("scene"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	user = u.(auth.User)
	line, ok := models.LoadLine(&user, book, scene, id)
	if ok != true {
		c.JSON(http.StatusNotFound, gin.H{"message": "Line not found"})
		return
	}
	c.JSON(http.StatusOK, line)
}

func PostLine(c *gin.Context) {
	var user auth.User
	var id int
	var ok bool
	var Line models.Line

	u, ok := c.Get("current_user")
	if ok != true {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	book, err := strconv.Atoi(c.Param("book"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	scene, err := strconv.Atoi(c.Param("scene"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	user = u.(auth.User)
	if err := c.BindJSON(&Line); err != nil {
		log.Println(err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Line format"})
		return
	}
	ok = models.SaveLine(&user, book, scene, id, Line)
	if ok != true {
		c.JSON(http.StatusNotFound, gin.H{"message": "Line not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func DeleteLine(c *gin.Context) {
	var user auth.User
	var id int
	var ok bool

	u, ok := c.Get("current_user")
	if ok != true {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	book, err := strconv.Atoi(c.Param("book"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	scene, err := strconv.Atoi(c.Param("scene"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	user = u.(auth.User)
	ok = models.DeleteLine(&user, book, scene, id)
	if ok != true {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func GenerateLine(c *gin.Context) {
	var user auth.User
	var id int
	var Line *models.Line
	var input input

	u, ok := c.Get("current_user")
	if ok != true {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	book, err := strconv.Atoi(c.Param("book"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	scene, err := strconv.Atoi(c.Param("scene"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	character, err := strconv.Atoi(c.Param("character"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Bad parameter"})
		return
	}
	user = u.(auth.User)
	if err := c.BindJSON(&input); err != nil {
		log.Println(err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Line format"})
		return
	}

	result := llm.Generate(&user, book, scene, character, id, input.Input)

	Line, ok = models.LoadLine(&user, book, scene, id)
	if ok != true {
		c.JSON(http.StatusNotFound, gin.H{"message": "Line not found"})
		return
	}
	if (len(Line.Content) == 1) && (Line.Content[0] == "") {
		Line.Content[0] = result
	} else {
		Line.Content = append(Line.Content, result)
		Line.Current = len(Line.Content) - 1
	}
	models.SaveLine(&user, book, scene, id, *Line)

	c.JSON(http.StatusOK, result)
}
