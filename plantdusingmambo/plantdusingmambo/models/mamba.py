import torch
import torch.nn as nn

class MambaBlock(nn.Module):
    def __init__(self, d_model, d_state=16):
        super().__init__()
        self.in_proj = nn.Linear(d_model, d_model * 2)
        self.conv1d = nn.Conv1d(d_model, d_model, kernel_size=4, groups=d_model, padding=3)
        self.x_proj = nn.Linear(d_model, d_state + d_model * 2)
        self.dt_proj = nn.Linear(d_state, d_model)
        self.out_proj = nn.Linear(d_model, d_model)

    def forward(self, x):
        return self.out_proj(self.in_proj(x))

class YOLOvMamba(nn.Module):
    def __init__(self, num_classes=80):
        super().__init__()
        self.backbone = nn.Sequential(*[MambaBlock(128) for _ in range(4)])
        self.head = nn.Linear(128, num_classes + 5)
    
    def forward(self, x):
        f = self.backbone(x)
        return self.head(f)
