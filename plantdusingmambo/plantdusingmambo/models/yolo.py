import torch
import torch.nn as nn
from models.common import Conv, Bottleneck
from models.mamba import MambaBlock

class YOLO_Mamba_Hybrid(nn.Module):
    def __init__(self, num_classes=80):
        super().__init__()
        self.stem = Conv(3, 64, 6, 2, 2)
        
        # Mamba Backbone integration
        self.layer1 = nn.Sequential(
            Conv(64, 128, 3, 2),
            MambaBlock(128),
            Bottleneck(128, 128)
        )
        self.layer2 = nn.Sequential(
            Conv(128, 256, 3, 2),
            MambaBlock(256),
            Bottleneck(256, 256)
        )
        
        self.head = nn.Sequential(
            nn.AdaptiveAvgPool2d((1,1)),
            nn.Flatten(),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.stem(x)
        x = self.layer1(x)
        x = self.layer2(x)
        return self.head(x)
