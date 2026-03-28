import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import sys

# Define paths
train_dir = r'C:\Users\user\Desktop\DD\SkinDisease_Kaggle\Skin cancer ISIC\Train'
val_dir = r'C:\Users\user\Desktop\DD\SkinDisease_Kaggle\Skin cancer ISIC\val'

# Ensure the directories exist
if not os.path.isdir(train_dir) or not os.path.isdir(val_dir):
    sys.exit("Error: One or both of the specified directories do not exist.")

# Ensure the folders are not empty
if len(os.listdir(train_dir)) == 0 or len(os.listdir(val_dir)) == 0:
    sys.exit("Error: One or both of the directories are empty.")

# Define parameters
img_width, img_height = 600, 450
batch_size = 32
num_classes = 10

# Set seed for reproducibility
seed = 42

# ImageDataGenerator for data augmentation (training)
train_datagen = ImageDataGenerator(
    rescale=1./255, 
    rotation_range=20, 
    zoom_range=0.15, 
    width_shift_range=0.2, 
    height_shift_range=0.2, 
    shear_range=0.15, 
    horizontal_flip=True, 
    fill_mode="nearest"
)

# ImageDataGenerator for validation (no augmentation)
val_datagen = ImageDataGenerator(rescale=1./255)

# Class labels (make sure these match exactly with the directory names)
class_labels = [
    'actinic keratosis','basal cell carcinoma','dermatofibroma','melanoma','nevus','normal skin',
    'pigmented benign keratosis','seborrheic keratosis','squamous cell carcinoma',
    'vascular lesion'
]

try:
    # Load the training data
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(img_width, img_height),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=True,
        seed=seed,
        classes=class_labels  # Make sure the classes match the subdirectories
    )

    # Load the validation data
    val_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=(img_width, img_height),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False,  # Typically, we don't shuffle validation data
        seed=seed,
        classes=class_labels  # Consistent class labeling
    )

    # Print confirmation
    print("Data generators created successfully.")

except Exception as e:
    sys.exit(f"Error occurred while creating data generators: {e}")
