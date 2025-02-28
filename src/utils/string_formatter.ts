export default function toTitleCase(str: string) {
    return str
      .toLowerCase() // Convert the whole string to lowercase first
      .split(' ') // Split the string into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(' '); // Join the words back into a single string
  }