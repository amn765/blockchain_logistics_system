import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          物流与资金流转追踪系统
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/">
            仪表板
          </Button>
          <Button color="inherit" component={Link} to="/products">
            产品管理
          </Button>
          <Button color="inherit" component={Link} to="/transactions">
            资金流转
          </Button>
          <Button color="inherit" component={Link} to="/logistics">
            物流追踪
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
