"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Upload,
  X,
  Plus,
  Save,
  Eye,
  ArrowLeft,
  ImageIcon,
  Video,
  Link as LinkIcon
} from "lucide-react"
import type { ProjectCategory, GameEngine, ProjectFormData } from "@/lib/types/portfolio"

const categories: { value: ProjectCategory; label: string }[] = [
  { value: "mobile_game", label: "Mobile Game" },
  { value: "web_game", label: "Web Game" },
  { value: "desktop_game", label: "Desktop Game" },
  { value: "vr_ar", label: "VR/AR" },
  { value: "prototype", label: "Prototype" },
  { value: "game_jam", label: "Game Jam" },
  { value: "portfolio_piece", label: "Portfolio Piece" },
  { value: "commercial", label: "Commercial" },
  { value: "educational", label: "Educational" },
  { value: "other", label: "Other" }
]

const engines: { value: GameEngine; label: string }[] = [
  { value: "unity", label: "Unity" },
  { value: "unreal", label: "Unreal Engine" },
  { value: "godot", label: "Godot" },
  { value: "construct", label: "Construct" },
  { value: "gamemaker", label: "GameMaker" },
  { value: "custom", label: "Custom Engine" },
  { value: "web_technologies", label: "Web Technologies" },
  { value: "other", label: "Other" }
]

const suggestedTags = [
  "2d", "3d", "action", "adventure", "puzzle", "rpg", "strategy", "simulation",
  "platformer", "shooter", "racing", "sports", "horror", "comedy", "multiplayer",
  "singleplayer", "mobile", "pc", "console", "vr", "ar", "indie", "prototype",
  "game-jam", "pixel-art", "low-poly", "realistic", "stylized", "retro",
  "cyberpunk", "fantasy", "sci-fi", "medieval", "modern", "futuristic"
]

const suggestedTechnologies = [
  "C#", "C++", "JavaScript", "TypeScript", "Python", "Lua", "GDScript",
  "Blender", "Maya", "3ds Max", "Photoshop", "GIMP", "Substance Painter",
  "Unity", "Unreal Engine", "Godot", "GameMaker", "Construct", "React",
  "Node.js", "MongoDB", "Firebase", "AWS", "Docker", "Git"
]

export default function CreateProjectPage() {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    shortDescription: "",
    category: "mobile_game",
    engine: "unity",
    tags: [],
    playableUrl: "",
    sourceCodeUrl: "",
    downloadUrl: "",
    developmentTime: "",
    teamSize: 1,
    myRole: "",
    challenges: "",
    learnings: "",
    technologies: [],
    features: [],
    isPublic: true,
    courseId: ""
  })

  const [currentTab, setCurrentTab] = useState("basic")
  const [newTag, setNewTag] = useState("")
  const [newTechnology, setNewTechnology] = useState("")
  const [newFeature, setNewFeature] = useState("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [thumbnailImage, setThumbnailImage] = useState<string>("")

  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange("tags", [...formData.tags, tag])
    }
    setNewTag("")
  }

  const removeTag = (tag: string) => {
    handleInputChange("tags", formData.tags.filter(t => t !== tag))
  }

  const addTechnology = (tech: string) => {
    if (tech && !formData.technologies.includes(tech)) {
      handleInputChange("technologies", [...formData.technologies, tech])
    }
    setNewTechnology("")
  }

  const removeTechnology = (tech: string) => {
    handleInputChange("technologies", formData.technologies.filter(t => t !== tech))
  }

  const addFeature = (feature: string) => {
    if (feature && !formData.features.includes(feature)) {
      handleInputChange("features", [...formData.features, feature])
    }
    setNewFeature("")
  }

  const removeFeature = (feature: string) => {
    handleInputChange("features", formData.features.filter(f => f !== feature))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Project data:", formData)
    // Here you would submit to your API
    alert("Project created successfully! (This is a demo)")
  }

  const handleSaveDraft = () => {
    console.log("Saving draft:", formData)
    alert("Draft saved! (This is a demo)")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Create New Project
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Showcase your game development work
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="publish">Publish</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Provide the essential details about your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter your project title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shortDescription">Short Description *</Label>
                    <Input
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                      placeholder="Brief one-line description"
                      maxLength={100}
                      required
                    />
                    <p className="text-xs text-slate-500">
                      {formData.shortDescription.length}/100 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Detailed description of your project, its features, and what makes it special"
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: ProjectCategory) => handleInputChange("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Game Engine *</Label>
                      <Select
                        value={formData.engine}
                        onValueChange={(value: GameEngine) => handleInputChange("engine", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select engine" />
                        </SelectTrigger>
                        <SelectContent>
                          {engines.map((engine) => (
                            <SelectItem key={engine.value} value={engine.value}>
                              {engine.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-2">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTag(newTag)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-slate-500 mr-2">Suggestions:</span>
                      {suggestedTags.slice(0, 10).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media */}
            <TabsContent value="media">
              <Card>
                <CardHeader>
                  <CardTitle>Media & Links</CardTitle>
                  <CardDescription>
                    Upload images, videos, and provide external links
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Thumbnail */}
                  <div className="space-y-2">
                    <Label>Thumbnail Image *</Label>
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
                      {thumbnailImage ? (
                        <div className="relative inline-block">
                          <img
                            src={thumbnailImage}
                            alt="Thumbnail"
                            className="max-w-xs max-h-48 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setThumbnailImage("")}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-500">
                          <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                          <p>Upload a thumbnail image</p>
                          <Button type="button" variant="outline" className="mt-2 gap-2">
                            <Upload className="w-4 h-4" />
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screenshots */}
                  <div className="space-y-2">
                    <Label>Screenshots</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* External Links */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="playableUrl">Playable URL</Label>
                      <Input
                        id="playableUrl"
                        value={formData.playableUrl}
                        onChange={(e) => handleInputChange("playableUrl", e.target.value)}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sourceCodeUrl">Source Code URL</Label>
                      <Input
                        id="sourceCodeUrl"
                        value={formData.sourceCodeUrl}
                        onChange={(e) => handleInputChange("sourceCodeUrl", e.target.value)}
                        placeholder="https://github.com/..."
                        type="url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="downloadUrl">Download URL</Label>
                      <Input
                        id="downloadUrl"
                        value={formData.downloadUrl}
                        onChange={(e) => handleInputChange("downloadUrl", e.target.value)}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Development Details */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Development Details</CardTitle>
                  <CardDescription>
                    Share your development process and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="developmentTime">Development Time</Label>
                      <Input
                        id="developmentTime"
                        value={formData.developmentTime}
                        onChange={(e) => handleInputChange("developmentTime", e.target.value)}
                        placeholder="e.g., 3 months, 2 weeks"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamSize">Team Size</Label>
                      <Input
                        id="teamSize"
                        type="number"
                        min="1"
                        value={formData.teamSize}
                        onChange={(e) => handleInputChange("teamSize", parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="myRole">My Role</Label>
                    <Input
                      id="myRole"
                      value={formData.myRole}
                      onChange={(e) => handleInputChange("myRole", e.target.value)}
                      placeholder="e.g., Lead Developer, Game Designer, Solo Developer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="challenges">Challenges Faced</Label>
                    <Textarea
                      id="challenges"
                      value={formData.challenges}
                      onChange={(e) => handleInputChange("challenges", e.target.value)}
                      placeholder="What were the main challenges you faced during development?"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="learnings">Key Learnings</Label>
                    <Textarea
                      id="learnings"
                      value={formData.learnings}
                      onChange={(e) => handleInputChange("learnings", e.target.value)}
                      placeholder="What did you learn from this project?"
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <Label>Key Features</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="gap-2">
                          {feature}
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature(newFeature))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addFeature(newFeature)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technical Information */}
            <TabsContent value="technical">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Information</CardTitle>
                  <CardDescription>
                    List the technologies and tools you used
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Technologies & Tools</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="gap-2">
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechnology(tech)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTechnology}
                        onChange={(e) => setNewTechnology(e.target.value)}
                        placeholder="Add a technology"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTechnology(newTechnology))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addTechnology(newTechnology)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-slate-500 mr-2">Suggestions:</span>
                      {suggestedTechnologies.slice(0, 12).map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => addTechnology(tech)}
                          className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Publish Settings */}
            <TabsContent value="publish">
              <Card>
                <CardHeader>
                  <CardTitle>Publish Settings</CardTitle>
                  <CardDescription>
                    Configure how your project will be displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
                      />
                      <Label htmlFor="isPublic">Make this project public</Label>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <p>Public projects will be visible in:</p>
                      <ul className="list-disc list-inside ml-4 mt-2">
                        <li>Portfolio gallery</li>
                        <li>Search results</li>
                        <li>Your public profile</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button type="button" variant="outline" onClick={handleSaveDraft}>
                      Save as Draft
                    </Button>
                    <Button type="submit" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Publish Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  )
}